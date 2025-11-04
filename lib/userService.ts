import { supabase } from './supabaseClient';
import type { UserDetail, Role, UserStatus, BookingDetail } from '../types';

/**
 * Fetches all users by calling a secure 'get_all_users' database function (RPC).
 */
export const fetchUsersWithRoles = async (): Promise<{ users: UserDetail[]; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) {
      // Enhanced error logging and handling
      console.error('Error fetching users with RPC:', JSON.stringify(error, null, 2));

      if (error.message.includes('column reference "role" is ambiguous')) {
          return { users: [], error: "Database configuration error: An ambiguous 'role' column was found. Please go to the Admin Dashboard and run the setup script from the User Management page to apply the fix." };
      }
      if (error.code === '42883' || error.message.includes('Could not find the function')) {
          return { users: [], error: "Backend not configured: The 'get_all_users' database function is missing. Please run the full setup script to create it." };
      }
      if (error.message.includes("Only admins can view all users")) {
          return { users: [], error: "Access Denied: You must be an admin to view user data."};
      }
      return { users: [], error: `Failed to fetch user profiles: ${error.message}` };
    }
    
    const users: UserDetail[] = (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      role: profile.role || 'user',
      name: profile.full_name || null,
      phone: profile.phone || null,
      status: profile.status || 'active',
    }));

    return { users, error: null };
  } catch (e) {
    console.error('Unhandled error in fetchUsersWithRoles:', e);
    let errorMessage = 'An unknown error occurred while fetching users.';
    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
        errorMessage = (e as { message: string }).message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { users: [], error: errorMessage };
  }
};

/**
 * Fetches a single user's profile details.
 */
export const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('phone, status, full_name')
        .eq('id', userId)
        .maybeSingle();
    
    if (error) {
        console.error('Error fetching user profile:', error);
        return { profile: null, error: 'Failed to load user profile.' };
    }
    return { profile: data, error: null };
};

/**
 * Fetches the currently authenticated user's full profile.
 */
export const fetchCurrentProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { profile: null, error: 'Not authenticated' };
    return fetchUserProfile(user.id);
};


/**
 * Updates a user's phone number in their profile.
 */
export const updateUserPhone = async (userId: string, phone: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ phone, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
        console.error('Error updating phone number:', error);
        return { error: 'Failed to save phone number. Please try again.' };
    }
    return { error: null };
};

/**
 * Updates the current user's profile details using a secure RPC.
 */
export const updateCurrentUserProfile = async (details: { name: string; phone: string }) => {
    const { error } = await supabase.rpc('update_user_profile', {
        p_full_name: details.name,
        p_phone: details.phone
    });

    if (error) {
        console.error('Error updating current user profile:', error);
        return { error: 'Failed to update profile. Please try again.' };
    }
    return { error: null };
};


/**
 * Updates comprehensive details for a specific user, including profile info and role.
 */
export const updateUserDetails = async (
    userId: string, 
    details: { name: string | null; phone: string | null; status: UserStatus; role: Role }
): Promise<{ error: string | null }> => {
    try {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: details.name, phone: details.phone, status: details.status })
            .eq('id', userId);
            
        if (profileError) throw profileError;

        const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({ user_id: userId, role: details.role }, { onConflict: 'user_id' });

        if (roleError) throw roleError;

        return { error: null };
    } catch (err: any) {
        console.error('Error updating user details:', err);
        return { error: err.message || 'An unexpected error occurred during the update.' };
    }
};

/**
 * Fetches all bookings for the currently authenticated user.
 */
export const fetchUserBookings = async (): Promise<{ bookings: BookingDetail[]; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc('get_user_bookings');
    if (error) throw error;
    // The RPC returns a JSON array, which is already in the correct shape.
    return { bookings: data || [], error: null };
  } catch (err: any) {
    console.error('Error fetching user bookings:', err);
    return { bookings: [], error: err.message };
  }
};


/**
 * Updates the status for a specific user in the profiles table.
 */
export const updateUserStatus = async (userId: string, status: UserStatus): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
    if (error) {
        console.error('Error updating user status:', error);
        return { error: `Failed to update user status: ${error.message}` };
    }
    return { error: null };
};

/**
 * Deletes a user from public tables (profiles, user_roles).
 * IMPORTANT: This does NOT delete the user from `auth.users`.
 */
export const deleteUserFromTables = async (userId: string): Promise<{ error: string | null }> => {
    try {
        const { error: roleError } = await supabase.from('user_roles').delete().eq('user_id', userId);
        if (roleError) throw roleError;

        const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
        if (profileError) throw profileError;

        return { error: null };
    } catch (err: any) {
        console.error('Error deleting user from tables:', err);
        return { error: err.message || 'An unexpected error occurred during deletion.' };
    }
};