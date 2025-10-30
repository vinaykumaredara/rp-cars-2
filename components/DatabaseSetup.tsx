import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const fullSetupSQL = `-- This script sets up all necessary database functions for the RP Cars admin panel.
-- Run this script once in your Supabase SQL Editor. It is safe to run multiple times.

-- Helper function to check if the current user is an admin.
-- This is used to secure other functions.
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

-- Function to get dashboard statistics for the admin panel.
-- Counts total cars, active bookings, and total users.
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
  select count(*) into active_bookings_count from public.bookings where status = 'confirmed';
  select count(*) into total_users_count from auth.users;

  return json_build_object(
    'total_cars', total_cars_count,
    'active_bookings', active_bookings_count,
    'total_users', total_users_count
  );
end;
$$;

-- Function to get a list of all users with their roles and profile info.
-- Secured to be callable only by admins.
-- This version uses a LEFT JOIN and explicitly qualifies the 'role' column to prevent ambiguity.
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
-- Joins with user tables to provide context for the admin.
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
-- Used for auth context to determine if a user is an admin.
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
                            <li>Go to your Supabase project dashboard.</li>
                            <li>Navigate to the "SQL Editor" section.</li>
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
