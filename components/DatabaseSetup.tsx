import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const fullSetupSQL = `-- This script provides a comprehensive setup for the RP Cars database, including tables, security policies, and functions.
-- It is idempotent, meaning it is safe to run multiple times.

-- === HELPER FUNCTIONS (Prerequisites) ===

-- Function to check if the current user is an admin. Used by RLS policies.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger function to automatically update 'updated_at' timestamps.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === ENUM TYPES (Custom Data Types) ===

-- Define a reusable ENUM type for car statuses.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'car_status') THEN
    CREATE TYPE car_status AS ENUM ('draft', 'published', 'active', 'maintenance');
  END IF;
END
$$;

-- Define a reusable ENUM type for booking statuses.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
    CREATE TYPE booking_status_enum AS ENUM ('pending_payment', 'hold', 'confirmed', 'cancelled', 'completed');
  ELSE
    -- Add values if they don't exist to avoid errors on re-run.
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'pending_payment';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'hold';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'confirmed';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'cancelled';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'completed';
  END IF;
END
$$;

-- Define a reusable ENUM type for payment statuses.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'success', 'failed', 'cancelled');
  END IF;
END
$$;

-- === TABLE CREATION & MIGRATIONS ===

-- Ensure the 'cars' table has all required columns and correct types.
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS available boolean NOT NULL DEFAULT true;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- The following block performs a safe migration for the 'cars.status' column from text to the car_status enum.
-- It handles dependencies like RLS policies that would otherwise block the ALTER TYPE command.
-- 1. Drop potentially conflicting RLS policies. They will be recreated correctly later.
DROP POLICY IF EXISTS "cars_select_published" ON public.cars;
DROP POLICY IF EXISTS "Allow public read access to published cars" ON public.cars;

-- 2. Normalize existing text data to match enum values before attempting to cast.
DO $$
BEGIN
  -- Only run normalization if the column is still of a text type.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cars'
      AND column_name = 'status'
      AND data_type IN ('text', 'character varying')
  ) THEN
    UPDATE public.cars SET status = 'published' WHERE lower(status) IN ('published','publish','live');
    UPDATE public.cars SET status = 'draft' WHERE lower(status) IN ('draft','unpublished');
    UPDATE public.cars SET status = 'active' WHERE lower(status) IN ('active','available');
    UPDATE public.cars SET status = 'maintenance' WHERE lower(status) IN ('maintenance','servicing','in_maintenance');
    -- Any remaining NULL or unmapped values are set to 'draft' as a safe default.
    UPDATE public.cars SET status = 'draft' WHERE status IS NULL OR status NOT IN (SELECT unnest(enum_range(NULL::car_status))::text);
  END IF;
END $$;

-- 3. Drop the old text-based default, alter the column type, and set the new enum-based default.
ALTER TABLE public.cars ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.cars ALTER COLUMN status TYPE car_status USING status::text::car_status;
ALTER TABLE public.cars ALTER COLUMN status SET DEFAULT 'published'::car_status;


-- Create the 'promo_codes' table if it doesn't exist.
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    discount_percent integer CHECK (discount_percent BETWEEN 1 AND 100),
    discount_flat numeric(10, 2) CHECK (discount_flat > 0),
    active boolean NOT NULL DEFAULT true,
    valid_from timestamptz,
    valid_to timestamptz,
    usage_limit integer NOT NULL DEFAULT 0,
    times_used integer NOT NULL DEFAULT 0,
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT one_discount_type CHECK (
        (discount_percent IS NOT NULL AND discount_flat IS NULL) OR
        (discount_percent IS NULL AND discount_flat IS NOT NULL)
    )
);

-- Ensure the 'bookings' table status uses the correct enum and has all columns.
-- 1. Normalize existing text data for bookings.status.
DO $$
BEGIN
  -- Only run normalization if the column is still of a text type.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'status'
      AND data_type IN ('text', 'character varying')
  ) THEN
    UPDATE public.bookings SET status = 'pending_payment' WHERE lower(status) IN ('pending','pending_payment');
    UPDATE public.bookings SET status = 'hold' WHERE lower(status) IN ('hold','on_hold');
    UPDATE public.bookings SET status = 'confirmed' WHERE lower(status) IN ('confirmed','booked');
    UPDATE public.bookings SET status = 'cancelled' WHERE lower(status) IN ('cancelled','canceled');
    UPDATE public.bookings SET status = 'completed' WHERE lower(status) IN ('completed','done','finished');
    -- Any remaining values set to a safe default.
    UPDATE public.bookings SET status = 'pending_payment' WHERE status IS NULL OR status NOT IN (SELECT unnest(enum_range(NULL::booking_status_enum))::text);
  END IF;
END $$;

-- 2. Alter the column type and set the new default.
ALTER TABLE public.bookings ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.bookings ALTER COLUMN status TYPE booking_status_enum USING status::text::booking_status_enum;
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending_payment'::booking_status_enum;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;
-- Add columns for promo code support. This fixes the "promo_code_id does not exist" error.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount numeric(10, 2) DEFAULT 0;

-- Create 'payments' table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extension_id uuid, -- FK constraint added later
    amount numeric(10, 2) NOT NULL,
    currency text NOT NULL DEFAULT 'INR',
    method text,
    status payment_status_enum NOT NULL DEFAULT 'pending',
    gateway_txn_id text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create 'booking_extensions' table
CREATE TABLE IF NOT EXISTS public.booking_extensions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    added_hours integer NOT NULL,
    requested_end timestamptz NOT NULL,
    price numeric(10, 2) NOT NULL,
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add the foreign key from payments to booking_extensions now that both tables exist.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_extension_id;
ALTER TABLE public.payments ADD CONSTRAINT fk_extension_id FOREIGN KEY (extension_id) REFERENCES public.booking_extensions(id) ON DELETE SET NULL;

-- Add Full-Text Search (FTS) column for performance.
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, ''))) STORED;
CREATE INDEX IF NOT EXISTS cars_fts_idx ON public.cars USING gin(fts);
CREATE INDEX IF NOT EXISTS cars_status_idx ON public.cars (status);

-- Create the 'licenses' table if it doesn't exist.
CREATE TABLE IF NOT EXISTS public.licenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- === TRIGGERS for 'updated_at' ===

DROP TRIGGER IF EXISTS set_timestamp ON public.cars;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp ON public.licenses;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp ON public.payments;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp ON public.booking_extensions;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.booking_extensions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp ON public.promo_codes;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
DROP TRIGGER IF EXISTS set_timestamp ON public.profiles;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


-- === ROW LEVEL SECURITY (RLS) POLICIES ===
-- These policies are CRITICAL for security and for the dashboard to function correctly.

-- Cars Table: Public can read published cars, admins have full access.
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to published cars" ON public.cars;
CREATE POLICY "Allow public read access to published cars" ON public.cars FOR SELECT USING (status = 'published'::car_status);
DROP POLICY IF EXISTS "Allow admins full access to cars" ON public.cars;
CREATE POLICY "Allow admins full access to cars" ON public.cars FOR ALL USING (is_admin());

-- Profiles Table: Users can manage their own profile, admins have full access.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own profile" ON public.profiles;
CREATE POLICY "Allow users to manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow admins full access to profiles" ON public.profiles;
CREATE POLICY "Allow admins full access to profiles" ON public.profiles FOR ALL USING (is_admin());

-- User Roles Table: Only admins can manage roles.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins full access to user_roles" ON public.user_roles;
CREATE POLICY "Allow admins full access to user_roles" ON public.user_roles FOR ALL USING (is_admin());

-- Bookings Table: Users manage their own, admins have full access.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own bookings" ON public.bookings;
CREATE POLICY "Allow users to manage their own bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow admins full access to bookings" ON public.bookings;
CREATE POLICY "Allow admins full access to bookings" ON public.bookings FOR ALL USING (is_admin());

-- Payments Table: Users can view their own, admins have full access.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to view their own payments" ON public.payments;
CREATE POLICY "Allow users to view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow admins full access to payments" ON public.payments;
CREATE POLICY "Allow admins full access to payments" ON public.payments FOR ALL USING (is_admin());

-- Licenses Table: Users manage their own, admins have full access.
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own licenses" ON public.licenses;
CREATE POLICY "Allow users to manage their own licenses" ON public.licenses FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow admins full access to licenses" ON public.licenses;
CREATE POLICY "Allow admins full access to licenses" ON public.licenses FOR ALL USING (is_admin());

-- Promo Codes: Authenticated users can read, admins have full access.
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read promo codes" ON public.promo_codes;
CREATE POLICY "Allow authenticated users to read promo codes" ON public.promo_codes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admins to manage promo codes" ON public.promo_codes;
CREATE POLICY "Allow admins to manage promo codes" ON public.promo_codes FOR ALL USING (is_admin());

-- === STORAGE SETUP & POLICIES ===

-- Car Photos Bucket (Public)
INSERT INTO storage.buckets (id, name, public) VALUES ('cars-photos', 'cars-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
DROP POLICY IF EXISTS "Allow public read access to car photos" ON storage.objects;
CREATE POLICY "Allow public read access to car photos" ON storage.objects FOR SELECT USING ( bucket_id = 'cars-photos' );
DROP POLICY IF EXISTS "Allow admins to manage car photos" ON storage.objects;
CREATE POLICY "Allow admins to manage car photos" ON storage.objects FOR ALL USING ( bucket_id = 'cars-photos' AND is_admin() ) WITH CHECK ( bucket_id = 'cars-photos' AND is_admin() );

-- License Uploads Bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('license-uploads', 'license-uploads', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow authenticated users to upload licenses" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload licenses" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'license-uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Allow users to view their own licenses" ON storage.objects;
CREATE POLICY "Allow users to view their own licenses" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'license-uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid);
DROP POLICY IF EXISTS "Allow admins to view all licenses" ON storage.objects;
CREATE POLICY "Allow admins to view all licenses" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'license-uploads' AND is_admin());

-- === RPC FUNCTIONS (Backend Logic) ===

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

-- FIX: Drop the function first to allow changing the return signature.
DROP FUNCTION IF EXISTS get_all_users();
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

-- FIX: Drop the function first to allow changing the return signature.
DROP FUNCTION IF EXISTS get_licenses_for_verification();
create or replace function get_licenses_for_verification()
returns table (
  id uuid,
  user_id uuid,
  storage_path text,
  verified boolean,
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
    l.verified,
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
      (b.status = 'confirmed' or (b.status = 'hold' and b.hold_expires_at > now())) and
      tstzrange(b.start_datetime, b.end_datetime) && tstzrange(start_ts, end_ts)
  );
$$;

create or replace function validate_promo_code(p_code text)
returns jsonb -- Use jsonb for efficiency
language plpgsql
security definer
set search_path = public
as $$
declare
  promo_record record;
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Attempt to find the promo code and lock it to prevent race conditions.
  select * into promo_record
  from public.promo_codes
  where code = upper(trim(p_code))
  for update;

  -- Special variable 'FOUND' is false if the last SELECT INTO found no rows.
  if not found then
    result := jsonb_build_object('valid', false, 'message', 'Invalid promo code. Please check the code and try again.');
    return result;
  end if;

  -- The code exists, now perform validation checks.
  if not promo_record.active then
    result := jsonb_build_object('valid', false, 'message', 'This promo code is not active.');
  elsif promo_record.valid_from is not null and promo_record.valid_from > now() then
    result := jsonb_build_object('valid', false, 'message', 'This promo code is not yet valid.');
  elsif promo_record.valid_to is not null and promo_record.valid_to < now() then
    result := jsonb_build_object('valid', false, 'message', 'This promo code has expired.');
  elsif promo_record.usage_limit > 0 and promo_record.times_used >= promo_record.usage_limit then
    result := jsonb_build_object('valid', false, 'message', 'This promo code has reached its usage limit.');
  else
    -- All checks passed, the code is valid.
    result := jsonb_build_object(
      'valid', true,
      'id', promo_record.id,
      'code', promo_record.code,
      'discount_percent', promo_record.discount_percent,
      'discount_flat', promo_record.discount_flat
    );
  end if;

  return result;
end;
$$;

create or replace function create_booking_and_payment(
  p_car_id uuid,
  p_user_id uuid,
  p_start_datetime timestamptz,
  p_end_datetime timestamptz,
  p_subtotal_amount numeric,
  p_payment_amount numeric,
  p_payment_method text,
  p_promo_code_id uuid default null
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
  final_discount_amount numeric := 0;
  final_total_amount numeric;
  promo_record record;
  total_after_discount numeric;
  service_charge numeric;
begin
  if p_promo_code_id is not null then
    select * into promo_record from public.promo_codes 
    where id = p_promo_code_id and active = true
      and (valid_from is null or valid_from <= now())
      and (valid_to is null or valid_to >= now())
      and (usage_limit = 0 or times_used < usage_limit)
    for update; 

    if promo_record is null then
      raise exception 'Promo code is no longer valid. Please remove it and try again.';
    end if;

    if promo_record.discount_flat is not null then
      final_discount_amount := promo_record.discount_flat;
    elsif promo_record.discount_percent is not null then
      final_discount_amount := p_subtotal_amount * (promo_record.discount_percent / 100.0);
    end if;
    
    if final_discount_amount > p_subtotal_amount then
       final_discount_amount := p_subtotal_amount;
    end if;
  end if;
  
  -- Correctly calculate the final total amount, including service charge, to match the frontend calculation.
  total_after_discount := p_subtotal_amount - final_discount_amount;
  service_charge := total_after_discount * 0.05;
  final_total_amount := total_after_discount + service_charge;

  select not exists (
    select 1
    from public.bookings b
    where
      b.car_id = p_car_id and
      (b.status = 'confirmed' or (b.status = 'hold' and b.hold_expires_at > now())) and
      tstzrange(b.start_datetime, b.end_datetime) && tstzrange(p_start_datetime, p_end_datetime)
    for update
  ) into is_available;

  if not is_available then
    raise exception 'Car is not available for the selected time range.';
  end if;

  insert into public.bookings (car_id, user_id, start_datetime, end_datetime, total_amount, status, promo_code_id, discount_amount)
  values (p_car_id, p_user_id, p_start_datetime, p_end_datetime, final_total_amount, 'pending_payment', p_promo_code_id, final_discount_amount)
  returning id into new_booking_id;

  insert into public.payments (booking_id, user_id, amount, method, status)
  values (new_booking_id, p_user_id, p_payment_amount, p_payment_method, 'pending')
  returning id into new_payment_id;

  return json_build_object('bookingId', new_booking_id, 'paymentId', new_payment_id);
end;
$$;

create or replace function verify_and_update_payment(
  p_payment_id uuid,
  p_gateway_txn_id text,
  p_status text
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
  if payment_record.status != 'pending' then return true; end if;

  if p_status = 'success' then
    update public.payments set status = 'success', gateway_txn_id = p_gateway_txn_id where id = p_payment_id;
    
    select * into booking_record from public.bookings where id = payment_record.booking_id;
    if booking_record.promo_code_id is not null and payment_record.extension_id is null then
      update public.promo_codes 
      set 
        times_used = times_used + 1,
        last_used_at = now()
      where id = booking_record.promo_code_id;
    end if;

    if payment_record.extension_id is not null then
      update public.booking_extensions set payment_status = 'success' where id = payment_record.extension_id returning * into extension_record;
      update public.bookings set end_datetime = extension_record.requested_end where id = extension_record.booking_id;
    else
      if abs(payment_record.amount - (booking_record.total_amount * 0.10)) < 0.01 then
        new_booking_status := 'hold';
        new_hold_expires_at := now() + interval '24 hours';
      else
        new_booking_status := 'confirmed';
        new_hold_expires_at := null;
      end if;
      update public.bookings set status = new_booking_status, hold_expires_at = new_hold_expires_at where id = payment_record.booking_id;
    end if;

  else 
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

-- FIX: Drop the function first to allow changing the return signature.
DROP FUNCTION IF EXISTS get_user_bookings();
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
        'user_id', b.user_id,
        'car_id', b.car_id,
        'customer_name', p.full_name,
        'customer_phone', p.phone,
        'car_title', c.title,
        'start_datetime', b.start_datetime,
        'end_datetime', b.end_datetime,
        'total_amount', b.total_amount,
        'status', b.status,
        'hold_expires_at', b.hold_expires_at,
        'discount_amount', b.discount_amount,
        'promo_code_id', b.promo_code_id,
        'cars', CASE WHEN c.id IS NOT NULL THEN json_build_object(
          'id', c.id,
          'title', c.title,
          'make', c.make,
          'model', c.model,
          'year', c.year,
          'seats', c.seats,
          'fuelType', c.fuel_type,
          'transmission', c.transmission,
          'pricePerDay', c.price_per_day,
          'verified', c.verified,
          'status', c.status,
          'imagePaths', COALESCE(c.image_paths, '{}'::text[]),
          'available', c.available
        ) ELSE NULL END,
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
    left join public.cars c on b.car_id = c.id
    left join public.profiles p on b.user_id = p.id
    where b.user_id = auth.uid()
  );
end;
$$;

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
  select * into booking_record from public.bookings where id = p_booking_id and user_id = auth.uid();
  if booking_record is null then raise exception 'Booking not found or you do not have permission to extend it.'; end if;
  if booking_record.status != 'confirmed' then raise exception 'Only confirmed bookings can be extended.'; end if;
  if booking_record.end_datetime <= now() then raise exception 'Cannot extend a booking that has already ended.'; end if;

  new_end_datetime := booking_record.end_datetime + (p_added_hours * interval '1 hour');

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

  select * into car_record from public.cars where id = booking_record.car_id;
  extension_price := (p_added_hours / 24.0) * car_record.price_per_day;

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
                        This page cannot load because your database is missing required helper functions or security policies. 
                        Please run the script below in your Supabase SQL Editor to create or update them. This will fix the admin panel and user dashboard.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold">Instructions:</h4>
                        <ol className="list-decimal list-inside text-sm space-y-1 mt-1">
                            <li>Click the "Copy Script" button below.</li>
                            <li>Go to your Supabase project dashboard and navigate to the "SQL Editor".</li>
                            <li>Click "+ New query", paste the script, and click "RUN".</li>
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