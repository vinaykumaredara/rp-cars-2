import { supabase } from './supabaseClient';
import type { UserDetail, Role, UserStatus } from '../types';

/**
 * Fetches all users by calling a secure 'get_all_users' database function (RPC).
 * This function performs a server-side join of the 'profiles' and 'user_roles' tables.
 * This approach is more efficient and secure than client-side joins.
 * @returns An object containing the list of users or an error message.
 */
export const fetchUsersWithRoles = async (): Promise<{ users: UserDetail[]; error: string | null }> => {
  // Call the get_all_users function created in the new setup script.
  const { data, error } = await supabase.rpc('get_all_users');

  if (error) {
    console.error('Error fetching users with RPC:', error);

    // Provide specific, helpful error messages for common setup problems.
    // PostgREST can return PGRST200 with a "not found" message, or the DB can return a '42883' code.
    if (error.code === '42883' || error.message.includes('Could not find the function')) {
        return {
            users: [],
            error: "Backend not configured: The 'get_all_users' database function is missing. Please run the full setup script to create it."
        };
    }
    if (error.message.includes("Only admins can view all users")) {
        return { users: [], error: "Access Denied: You must be an admin to view user data."};
    }
    if (error.message.includes("Could not find a relationship")) {
        return {
            users: [],
            error: "Database schema mismatch: A relationship between user tables is misconfigured. Please run the full setup script to fix it."
        };
    }

    return { users: [], error: `Failed to fetch user profiles: ${error.message}` };
  }
  
  const users: UserDetail[] = (data || []).map((profile: any) => ({
    id: profile.id,
    email: undefined, // Email is in auth.users and not accessible from client-side for security
    role: profile.role || 'user',
    name: profile.full_name || null,
    phone: profile.phone || null,
    status: profile.status || 'active',
  }));

  return { users, error: null };
};


/**
 * Updates comprehensive details for a specific user, including profile info and role.
 * @param userId - The UUID of the user to update.
 * @param details - An object containing the details to update.
 * @returns An object containing an error message if any update fails.
 */
export const updateUserDetails = async (
    userId: string, 
    details: { name: string | null; phone: string | null; status: UserStatus; role: Role }
): Promise<{ error: string | null }> => {
    // 1. Update the profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: details.name,
            phone: details.phone,
            status: details.status
        })
        .eq('id', userId);
        
    if (profileError) {
        console.error('Error updating user profile:', profileError);
        return { error: `Failed to update user profile: ${profileError.message}` };
    }

    // 2. Update the user_roles table
    const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: details.role }, { onConflict: 'user_id' });

    if (roleError) {
        console.error('Error updating user role:', roleError);
        return { error: `Failed to update user role: ${roleError.message}` };
    }

    return { error: null };
};

/**
 * Updates the status for a specific user in the profiles table.
 * @param userId - The UUID of the user to update.
 * @param status - The new status to assign ('active' or 'inactive').
 * @returns An object containing an error message if the update fails.
 */
export const updateUserStatus = async (userId: string, status: UserStatus): Promise<{ error: string | null }> => {
    const { error } = await supabase
        .from('profiles')
        .update({ status: status })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user status:', error);
        return { error: `Failed to update user status: ${error.message}` };
    }
    return { error: null };
};

/**
 * Deletes a user from public tables (profiles, user_roles).
 * IMPORTANT: This does NOT delete the user from `auth.users`. True user deletion
 * requires admin privileges and should be handled in a secure server environment
 * (e.g., a Supabase Edge Function).
 * @param userId - The UUID of the user to delete.
 * @returns An object containing an error message if deletion fails.
 */
export const deleteUserFromTables = async (userId: string): Promise<{ error: string | null }> => {
    const { error: roleError } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (roleError) {
        console.error('Error deleting user role:', roleError);
        return { error: `Failed to delete user role: ${roleError.message}` };
    }

    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileError) {
        console.error('Error deleting user profile:', profileError);
        return { error: `Failed to delete user profile: ${profileError.message}` };
    }

    return { error: null };
};

/**
 * Updates the role for a specific user in the user_roles table.
 * Note: `updateUserDetails` is preferred for combined updates.
 * @param userId - The UUID of the user to update.
 * @param role - The new role to assign ('admin' or 'user').
 * @returns An object containing an error message if the update fails.
 */
export const updateUserRole = async (userId: string, role: Role): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: role }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error updating user role:', error);
    return { error: `Failed to update user role: ${error.message}` };
  }

  return { error: null };
};