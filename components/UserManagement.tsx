import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchUsersWithRoles, updateUserStatus, deleteUserFromTables } from '../lib/userService';
import type { UserDetail, UserStatus } from '../types';
import UserEditModal from './UserEditModal';
import ConfirmationModal from './ConfirmationModal';
import AdminPageLayout from './AdminPageLayout';

const BackendSetupInstructions: React.FC<{ onRefresh: () => void; isLoading: boolean }> = ({ onRefresh, isLoading }) => {
  // Dynamically create the project-specific SQL editor URL
  // FIX: The `supabase.rest.url` property is protected. Use the known public URL to extract the project reference.
  const projectRef = new URL('https://rcpkhtlvfvafympulywx.supabase.co').hostname.split('.')[0];
  const sqlEditorLink = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const setupSql = `-- This is a comprehensive script to set up all necessary database objects for User Management.
-- It's safe to run this entire script in your Supabase SQL Editor even if parts already exist.

-- 1. Create custom type for user status (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE public.user_status AS ENUM ('active', 'inactive');
  END IF;
END$$;

-- 2. Define a helper function to check admin role, bypassing RLS itself.
-- This function runs with the privileges of its owner (usually the postgres user),
-- allowing it to read the user_roles table without triggering its own RLS policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin';
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN FALSE; -- If user_roles entry not found, the user is not an admin.
END;
$$;

-- Grant execution to authenticated users for the is_admin() function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Create the 'profiles' table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  status public.user_status DEFAULT 'active'::public.user_status,
  updated_at timestamptz
);
-- Enable Row Level Security on 'profiles'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Create policies for 'profiles' (safe to re-run)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Create the 'user_roles' table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL
);
-- Enable Row Level Security on 'user_roles'
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- Create policies for 'user_roles' (safe to re-run)
DROP POLICY IF EXISTS "Admins can manage all roles." ON public.user_roles;
-- This policy now uses the is_admin() helper function to avoid recursion.
-- The WITH CHECK clause also uses is_admin() to ensure only admins can set roles.
CREATE POLICY "Admins can manage all roles." ON public.user_roles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users can view their own role." ON public.user_roles;
CREATE POLICY "Users can view their own role." ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Create/replace the trigger function to populate 'profiles' and 'user_roles' for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Add new user to profiles table
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  -- Add default 'user' role for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach the trigger to auth.users table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END$$;

-- 7. Create/replace the database function to securely fetch all user details for admins
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  status user_status,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This security check ensures only users with the 'admin' role can execute this function.
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can view all users.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.phone,
    p.status,
    COALESCE(ur.role, 'user') AS role -- Default to 'user' if role is missing for some reason
  FROM
    public.profiles p
  LEFT JOIN
    public.user_roles ur ON p.id = ur.user_id;
END;
$$;

-- 8. Create/replace the database function to securely fetch dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats json;
BEGIN
  -- Security check: only admins can get stats
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can view dashboard stats.';
  END IF;

  SELECT json_build_object(
    'total_cars', (SELECT COUNT(*) FROM public.cars),
    'active_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed' AND end_datetime > NOW()),
    'total_users', (SELECT COUNT(*) FROM public.profiles)
  ) INTO stats;

  RETURN stats;
END;
$$;

-- 9. Create/replace the database function to securely fetch a single user's role for client-side authentication context
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = p_user_id;
  RETURN COALESCE(user_role, 'user'); -- Default to 'user' if no role found
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN 'user'; -- Explicitly handle no data found, return 'user'
END;
$$;

-- Fix: Grant execution to authenticated users for the get_user_role(uuid) function
-- It must specify the parameter type 'uuid'.
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- 10. Create 'bookings' table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE SET NULL,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  amount_paid numeric(10, 2),
  payment_mode text,
  status text NOT NULL DEFAULT 'pending',
  extras jsonb,
  user_phone text
);

-- 11. Enable RLS on 'bookings' and create policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all bookings." ON public.bookings;
CREATE POLICY "Admins can manage all bookings." ON public.bookings FOR ALL
  USING (public.is_admin());
DROP POLICY IF EXISTS "Users can view their own bookings." ON public.bookings;
CREATE POLICY "Users can view their own bookings." ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

-- 12. Create/replace function to get all bookings for admin dashboard
CREATE OR REPLACE FUNCTION get_all_bookings()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  user_id uuid,
  customer_name text,
  customer_phone text,
  car_id uuid,
  car_title text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  total_amount numeric,
  status text,
  payment_mode text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view all bookings.';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.created_at,
    b.user_id,
    p.full_name AS customer_name,
    b.user_phone AS customer_phone,
    b.car_id,
    c.title AS car_title,
    b.start_datetime,
    b.end_datetime,
    b.total_amount,
    b.status,
    b.payment_mode
  FROM
    public.bookings b
  LEFT JOIN
    public.profiles p ON b.user_id = p.id
  LEFT JOIN
    public.cars c ON b.car_id = c.id
  ORDER BY
    b.created_at DESC;
END;
$$;
`;
  
  return (
    <div className="bg-white p-6 rounded-xl border border-yellow-300 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div className="ml-3">
          <h2 className="text-xl font-bold text-yellow-800">Database Setup Required</h2>
          <p className="mt-2 text-gray-700">It seems your database schema is missing some components required for this feature (like the `user_roles` table or the `get_all_users` function).</p>
          <p className="mt-2 text-gray-700">Please run the following script in your Supabase <a href={sqlEditorLink} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">SQL Editor</a> to create and configure all necessary tables and functions.</p>
        </div>
      </div>

      <pre className="bg-gray-800 text-white p-4 rounded-md mt-4 overflow-x-auto text-sm">
        <code>{setupSql}</code>
      </pre>

      <div className="mt-4 text-right">
        <button onClick={onRefresh} disabled={isLoading} className="px-5 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-hover transition disabled:opacity-50">
          {isLoading ? 'Verifying...' : 'I have run the script, Refresh'}
        </button>
      </div>
    </div>
  );
};


const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userToProcess, setUserToProcess] = useState<UserDetail | null>(null);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');

  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    const { users, error } = await fetchUsersWithRoles();
    setUsers(users);
    setError(error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUsers();

    const channel = supabase
      .channel('user-management-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => refreshUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshUsers())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshUsers]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => statusFilter === 'all' || user.status === statusFilter)
      .filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) || // Keep for future-proofing
          user.phone?.toLowerCase().includes(term)
        );
      });
  }, [users, searchTerm, statusFilter]);

  const handleEditUser = (user: UserDetail) => { setSelectedUser(user); setIsEditModalOpen(true); };
  const handleDeactivateUser = (user: UserDetail) => { setUserToProcess(user); setIsDeactivateConfirmOpen(true); };
  const handleDeleteUser = (user: UserDetail) => { setUserToProcess(user); setIsDeleteConfirmOpen(true); };

  const onConfirmDeactivate = async () => {
    if (!userToProcess) return;
    setIsProcessing(true);
    const newStatus = userToProcess.status === 'active' ? 'inactive' : 'active';
    await updateUserStatus(userToProcess.id, newStatus);
    setIsProcessing(false);
    setIsDeactivateConfirmOpen(false);
    setUserToProcess(null);
  };

  const onConfirmDelete = async () => {
    if (!userToProcess) return;
    setIsProcessing(true);
    await deleteUserFromTables(userToProcess.id);
    setIsProcessing(false);
    setIsDeleteConfirmOpen(false);
    setUserToProcess(null);
  };

  const handleExportToCsv = () => {
    const headers = ['ID', 'Name', 'Phone', 'Role', 'Status'];
    const rows = filteredUsers.map(user => [
        `"${user.id}"`,
        `"${user.name || ''}"`,
        `"${user.phone || ''}"`,
        `"${user.role}"`,
        `"${user.status}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `user_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const renderContent = () => {
    if (isLoading && users.length === 0) {
      return <p className="p-6 text-center text-gray-600">Loading users...</p>;
    }
    
    // Check for a wider range of setup-related errors to ensure instructions are shown when needed.
    const isSetupError = error && (
      error.includes("Backend not configured") ||
      error.includes("Database schema mismatch") ||
      error.includes("function is missing") || // Catches missing is_admin() or get_user_role()
      error.includes("permission denied for function is_admin") || // Catches missing GRANT EXECUTE on is_admin()
      error.includes("permission denied for function get_user_role") || // Catches missing GRANT EXECUTE on get_user_role()
      error.includes("function public.get_user_role(uuid) does not exist") // Catches the specific error reported
    );

    if (isSetupError) {
      return <BackendSetupInstructions onRefresh={refreshUsers} isLoading={isLoading} />;
    }
    
    if (error) {
      return <p className="p-6 text-center text-red-600 bg-red-100">{error}</p>;
    }
    
    return (
      <>
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded border-gray-300 focus:ring-primary focus:border-primary"
            />
            <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full p-2 border rounded bg-white border-gray-300 focus:ring-primary focus:border-primary"
            >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            <button
                onClick={handleExportToCsv}
                className="px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg shadow-sm hover:bg-gray-200 transition"
            >
                Export to CSV
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500 truncate" style={{maxWidth: '150px'}} title={user.id}>{user.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEditUser(user)} className="text-primary hover:text-primary-hover">Edit</button>
                    <button onClick={() => handleDeactivateUser(user)} className="text-yellow-600 hover:text-yellow-800">{user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <p className="p-6 text-center text-gray-500">No users match the current filters.</p>}
        </div>
      </>
    );
  };
  
  return (
    <>
      <AdminPageLayout
        title="User Management"
        subtitle="View, search, filter, and manage all registered users."
      >
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          {renderContent()}
        </div>
      </AdminPageLayout>
      
      {isEditModalOpen && selectedUser && <UserEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={() => setIsEditModalOpen(false)} user={selectedUser}/>}
      {userToProcess && <ConfirmationModal isOpen={isDeactivateConfirmOpen} onClose={() => setIsDeactivateConfirmOpen(false)} onConfirm={onConfirmDeactivate} title={`${userToProcess.status === 'active' ? 'Deactivate' : 'Activate'} User`} message={<>Are you sure you want to {userToProcess.status === 'active' ? 'deactivate' : 'activate'} <strong>{userToProcess.name || userToProcess.id}</strong>?</>} confirmText={userToProcess.status === 'active' ? 'Deactivate' : 'Activate'} isConfirming={isProcessing}/>}
      {userToProcess && <ConfirmationModal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={onConfirmDelete} title="Delete User" message={<>Are you sure you want to permanently delete <strong>{userToProcess.name || userToProcess.id}</strong>? This action cannot be undone.</>} confirmText="Delete" isConfirming={isProcessing} />}
    </>
  );
};

export default UserManagement;