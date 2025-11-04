import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const fullSetupSQL = `-- This script sets up all necessary database functions and migrations for the RP Cars admin panel.
-- Run this script once in your Supabase SQL Editor. It is safe to run multiple times.

-- Helper function to check if the current user is an admin.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- === BOOKING EXTENSION MIGRATION (Version 5) ===
-- This section adds the booking_extensions table.

CREATE TABLE IF NOT EXISTS public.booking_extensions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    added_hours integer NOT NULL CHECK (added_hours >= 12 AND added_hours % 12 = 0),
    requested_end timestamptz NOT NULL,
    price numeric(10, 2) NOT NULL,
    payment_status text NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
    payment_id uuid REFERENCES public.payments(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_extensions_booking_id ON public.booking_extensions(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_extensions_user_id ON public.booking_extensions(user_id);

-- Add RLS policies for booking_extensions
ALTER TABLE public.booking_extensions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to view their own extensions" ON public.booking_extensions;
CREATE POLICY "Allow users to view their own extensions" ON public.booking_extensions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow users to create their own extensions" ON public.booking_extensions;
CREATE POLICY "Allow users to create their own extensions" ON public.booking_extensions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Enable admin full access on extensions" ON public.booking_extensions;
CREATE POLICY "Enable admin full access on extensions" ON public.booking_extensions FOR ALL USING (is_admin());


-- === PAYMENT SYSTEM MIGRATION (Version 3 & 5) ===
-- This section creates and safely alters the 'payments' table to match the application schema.
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    currency text NOT NULL DEFAULT 'INR',
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Safely add columns to an existing 'payments' table to make it compatible.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='payments' AND table_schema='public') THEN
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS extension_id uuid REFERENCES public.booking_extensions(id) ON DELETE SET NULL;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method text;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_txn_id text;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata jsonb;
  END IF;
END;
$$;


-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_extension_id ON public.payments(extension_id);


-- Add a trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.payments;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON public.booking_extensions;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.booking_extensions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- === AVAILABILITY SYSTEM MIGRATION (Version 2) ===
-- This section adds robust, time-based availability checking.

-- 1. Modify the 'bookings' table for enhanced status tracking.
-- Add new statuses to the enum type for bookings.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
    CREATE TYPE booking_status_enum AS ENUM ('pending_payment', 'hold', 'confirmed', 'cancelled', 'completed');
  ELSE
    -- These checks must be separate to avoid errors if a value already exists.
    BEGIN ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'pending_payment'; EXCEPTION WHEN duplicate_object THEN null; END;
    BEGIN ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'hold'; EXCEPTION WHEN duplicate_object THEN null; END;
    BEGIN ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'confirmed'; EXCEPTION WHEN duplicate_object THEN null; END;
    BEGIN ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'cancelled'; EXCEPTION WHEN duplicate_object THEN null; END;
    BEGIN ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'completed'; EXCEPTION WHEN duplicate_object THEN null; END;
  END IF;
END
$$;

-- Alter the bookings table status column.
ALTER TABLE public.bookings ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.bookings ALTER COLUMN status TYPE booking_status_enum USING status::text::booking_status_enum;
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending_payment'::booking_status_enum;

-- Add a column to track when a hold expires.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;

-- 2. Remove the denormalized 'booking_status' from the 'cars' table.
ALTER TABLE public.cars DROP COLUMN IF EXISTS booking_status;
-- === END MIGRATION ===


-- === STORAGE POLICIES (Version 4) ===
-- Policies for the 'license-uploads' bucket. Assumes bucket is private.

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('license-uploads', 'license-uploads', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload to their own folder.
-- The folder is named after their user_id.
CREATE POLICY "Allow authenticated users to upload licenses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'license-uploads' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Policy: Allow users to view/download their own uploaded licenses.
CREATE POLICY "Allow users to view their own licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'license-uploads' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Policy: Allow admins to view/download any license.
CREATE POLICY "Allow admins to view all licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'license-uploads' AND
  is_admin()
);

-- === END MIGRATION ===


-- Function to get dashboard statistics for the admin panel.
create or replace function get_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  total_cars_count int;
  active_bookings_count int;
  total_users_count int;
begin
  if not is_admin() then
    raise exception 'Admin privileges required';
  end if;

  select count(*) into total_cars_count from public.cars;
  -- Active bookings are now 'confirmed' or non-expired 'hold'
  select count(*) into active_bookings_count from public.bookings 
  where status = 'confirmed' or (status = 'hold' and hold_expires_at > now());
  
  select count(*) into total_users_count from auth.users;

  return json_build_object(
    'total_cars', total_cars_count,
    'active_bookings', active_bookings_count,
    'total_users', total_users_count
  );
end;
$$;

-- Function to get a list of all users with their roles and profile info.
create or replace function get_all_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  status text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only admins can view all users';
  end if;

  return query
  select
    u.id,
    u.email,
    p.full_name,
    p.phone,
    p.status,
    coalesce(ur.role::text, 'user') as role
  from auth.users u
  left join public.profiles p on u.id = p.id
  left join public.user_roles ur on u.id = ur.user_id;
end;
$$;

-- Function to get licenses pending verification.
create or replace function get_licenses_for_verification()
returns table (
  id uuid,
  user_id uuid,
  storage_path text,
  created_at timestamptz,
  user_name text,
  user_email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Admin privileges required';
  end if;

  return query
  select
    l.id,
    l.user_id,
    l.storage_path,
    l.created_at,
    p.full_name as user_name,
    u.email as user_email
  from public.licenses l
  join auth.users u on l.user_id = u.id
  left join public.profiles p on l.user_id = p.id
  where l.verified = false
  order by l.created_at asc;
end;
$$;

-- Function to get the role of a specific user.
create or replace function get_user_role(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  select role into user_role from public.user_roles where user_id = p_user_id;
  return user_role;
end;
$$;

-- Function to find available cars for a given time range.
create or replace function get_available_cars(start_ts timestamptz, end_ts timestamptz)
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select id from public.cars
  where not exists (
    select 1
    from public.bookings b
    where
      b.car_id = public.cars.id and
      -- The booking is active (confirmed or a non-expired hold)
      (b.status = 'confirmed' or (b.status = 'hold' and b.hold_expires_at > now())) and
      -- And it overlaps with the requested time range
      tstzrange(b.start_datetime, b.end_datetime) && tstzrange(start_ts, end_ts)
  );
$$;

-- Atomically create a booking and a pending payment, with an inline availability check.
create or replace function create_booking_and_payment(
  p_car_id uuid,
  p_user_id uuid,
  p_start_datetime timestamptz,
  p_end_datetime timestamptz,
  p_total_amount numeric,
  p_payment_amount numeric,
  p_payment_method text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  is_available boolean;
  new_booking_id uuid;
  new_payment_id uuid;
begin
  -- Step 1: Check availability (inlined from helper function for robustness).
  -- This prevents race conditions where two users book at the same time.
  select not exists (
    select 1
    from public.bookings b
    where
      b.car_id = p_car_id and
      (b.status = 'confirmed' or (b.status = 'hold' and b.hold_expires_at > now())) and
      tstzrange(b.start_datetime, b.end_datetime) && tstzrange(p_start_datetime, p_end_datetime)
    for update -- Lock the rows being checked to prevent race conditions
  ) into is_available;

  if not is_available then
    raise exception 'Car is not available for the selected time range.';
  end if;

  -- Step 2: Insert the new booking record.
  insert into public.bookings (car_id, user_id, start_datetime, end_datetime, total_amount, status)
  values (p_car_id, p_user_id, p_start_datetime, p_end_datetime, p_total_amount, 'pending_payment')
  returning id into new_booking_id;

  -- Step 3: Create the associated payment record.
  insert into public.payments (booking_id, user_id, amount, method, status)
  values (new_booking_id, p_user_id, p_payment_amount, p_payment_method, 'pending')
  returning id into new_payment_id;

  -- Step 4: Return both IDs to the client.
  return json_build_object('bookingId', new_booking_id, 'paymentId', new_payment_id);
end;
$$;


-- New function to verify payment and update booking status. Simulates a secure webhook.
-- UPDATED FOR EXTENSIONS
create or replace function verify_and_update_payment(
  p_payment_id uuid,
  p_gateway_txn_id text,
  p_status text -- 'success' or 'failed' from the gateway
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_record public.payments;
  booking_record public.bookings;
  extension_record public.booking_extensions;
  new_booking_status booking_status_enum;
  new_hold_expires_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;

  select * into payment_record from public.payments where id = p_payment_id;
  if payment_record is null then raise exception 'Payment not found.'; end if;
  if payment_record.user_id != auth.uid() and not is_admin() then raise exception 'Authorization failed.'; end if;
  if payment_record.status != 'pending' then return true; end if; -- Idempotency

  if p_status = 'success' then
    update public.payments set status = 'success', gateway_txn_id = p_gateway_txn_id where id = p_payment_id;
    
    -- Check if this payment is for an extension
    if payment_record.extension_id is not null then
      update public.booking_extensions set payment_status = 'success' where id = payment_record.extension_id returning * into extension_record;
      update public.bookings set end_datetime = extension_record.requested_end where id = extension_record.booking_id;
    else
      -- Original booking logic
      select * into booking_record from public.bookings where id = payment_record.booking_id;
      if abs(payment_record.amount - (booking_record.total_amount * 0.10)) < 0.01 then
        new_booking_status := 'hold';
        new_hold_expires_at := now() + interval '24 hours';
      else
        new_booking_status := 'confirmed';
        new_hold_expires_at := null;
      end if;
      update public.bookings set status = new_booking_status, hold_expires_at = new_hold_expires_at where id = payment_record.booking_id;
    end if;

  else -- Payment failed
    update public.payments set status = 'failed', gateway_txn_id = p_gateway_txn_id where id = p_payment_id;
    if payment_record.extension_id is not null then
      update public.booking_extensions set payment_status = 'failed' where id = payment_record.extension_id;
    else
      update public.bookings set status = 'cancelled' where id = payment_record.booking_id;
    end if;
  end if;
  
  return true;
end;
$$;


-- Function to clean up expired holds.
create or replace function cleanup_expired_holds()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set status = 'cancelled'
  where
    status = 'hold' and
    hold_expires_at is not null and
    hold_expires_at < now();
end;
$$;

-- Function to get all bookings for the currently authenticated user.
-- UPDATED FOR EXTENSIONS
create or replace function get_user_bookings()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return (
    select json_agg(
      json_build_object(
        'id', b.id,
        'created_at', b.created_at,
        'start_datetime', b.start_datetime,
        'end_datetime', b.end_datetime,
        'total_amount', b.total_amount,
        'status', b.status,
        'cars', json_build_object(
          'id', c.id,
          'title', c.title,
          'pricePerDay', c.price_per_day
        ),
        'booking_extensions', (
          select json_agg(
            json_build_object(
              'id', be.id,
              'added_hours', be.added_hours,
              'requested_end', be.requested_end,
              'price', be.price,
              'payment_status', be.payment_status,
              'created_at', be.created_at
            )
          )
          from public.booking_extensions be
          where be.booking_id = b.id
        )
      )
    )
    from public.bookings b
    join public.cars c on b.car_id = c.id
    where b.user_id = auth.uid()
  );
end;
$$;


-- Function for a user to update their own profile information.
create or replace function update_user_profile(
  p_full_name text,
  p_phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  
  update public.profiles
  set
    full_name = p_full_name,
    phone = p_phone,
    updated_at = now()
  where id = auth.uid();
end;
$$;

-- Function to create a booking extension intent.
create or replace function create_extension_and_payment(
  p_booking_id uuid,
  p_added_hours integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_record public.bookings;
  car_record public.cars;
  is_available boolean;
  new_end_datetime timestamptz;
  extension_price numeric;
  new_extension_id uuid;
  new_payment_id uuid;
begin
  -- Validate user and booking
  select * into booking_record from public.bookings where id = p_booking_id and user_id = auth.uid();
  if booking_record is null then raise exception 'Booking not found or you do not have permission to extend it.'; end if;
  if booking_record.status != 'confirmed' then raise exception 'Only confirmed bookings can be extended.'; end if;
  if booking_record.end_datetime <= now() then raise exception 'Cannot extend a booking that has already ended.'; end if;

  new_end_datetime := booking_record.end_datetime + (p_added_hours * interval '1 hour');

  -- Availability check (within a transaction lock)
  select not exists (
    select 1
    from public.bookings b
    where
      b.car_id = booking_record.car_id and
      b.id != p_booking_id and
      (b.status = 'confirmed' or (b.status = 'hold' and b.hold_expires_at > now())) and
      tstzrange(b.start_datetime, b.end_datetime) && tstzrange(booking_record.end_datetime, new_end_datetime)
    for update
  ) into is_available;

  if not is_available then
    raise exception 'The car is not available for the requested extension period.';
  end if;

  -- Calculate price
  select * into car_record from public.cars where id = booking_record.car_id;
  extension_price := (p_added_hours / 24.0) * car_record.price_per_day;

  -- Create extension and payment records
  insert into public.booking_extensions (booking_id, user_id, added_hours, requested_end, price, payment_status)
  values (p_booking_id, auth.uid(), p_added_hours, new_end_datetime, extension_price, 'pending')
  returning id into new_extension_id;

  insert into public.payments (booking_id, user_id, extension_id, amount, method, status)
  values (p_booking_id, auth.uid(), new_extension_id, extension_price, 'paytm', 'pending')
  returning id into new_payment_id;

  update public.booking_extensions set payment_id = new_payment_id where id = new_extension_id;

  return json_build_object('extensionId', new_extension_id, 'paymentId', new_payment_id);
end;
$$;
`;

const DatabaseSetup: React.FC = () => {
    const { addToast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullSetupSQL).then(() => {
            addToast('SQL script copied to clipboard!', 'success');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
        }, () => {
            addToast('Failed to copy script.', 'error');
        });
    };

    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-6 rounded-r-lg" role="alert">
            <div className="flex">
                <div className="py-1">
                    <svg className="fill-current h-6 w-6 text-amber-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8h2v2H9v-2z"/></svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-2">Admin Backend Setup Required</h3>
                    <p className="mb-4 text-base">
                        This page cannot load because your database is missing required helper functions. 
                        Please run the script below in your Supabase SQL Editor to create or update them. This will fix the admin panel.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold">Instructions:</h4>
                        <ol className="list-decimal list-inside text-sm space-y-1 mt-1">
                            <li>Click the "Copy Script" button below.</li>
                            <li>Go to your Supabase project dashboard and navigate to the "SQL Editor".</li>
                            <li>Click "+ New query", paste the script, and click "RUN".</li>
                            <li>(Optional but Recommended) Go to Database &gt; Functions &gt; pg_cron to schedule `cleanup_expired_holds()` to run daily.</li>
                            <li>Once the script finishes, refresh this page.</li>
                        </ol>
                    </div>

                    <div className="bg-gray-800 text-white p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64 relative">
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 text-xs font-sans rounded-md transition"
                        >
                            {isCopied ? 'Copied!' : 'Copy Script'}
                        </button>
                        <pre><code>{fullSetupSQL}</code></pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseSetup;
