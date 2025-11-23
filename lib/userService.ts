import { supabase } from './supabaseClient';
import type { UserDetail, Role, UserStatus, BookingDetail, Car } from '../types';
import { parseError } from './errorUtils';

/**
 * Fetches all users by calling a secure 'get_all_users' database function (RPC).
 */
export const fetchUsersWithRoles = async (): Promise<{ users: UserDetail[]; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) {
      if (error.message.includes('column reference "role" is ambiguous')) {
          return { users: [], error: "Database configuration error: An ambiguous 'role' column was found. Please go to the Admin Dashboard and run the setup script from the User Management page to apply the fix." };
      }
      if (error.code === '42883' || error.message.includes('Could not find the function')) {
          return { users: [], error: "Backend not configured: The 'get_all_users' database function is missing. Please run the full setup script to create it." };
      }
      if (error.message.includes("Only admins can view all users")) {
          return { users: [], error: "Access Denied: You must be an admin to view user data."};
      }
      throw error;
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
  } catch (e: unknown) {
    return { users: [], error: parseError(e) };
  }
};

/**
 * Fetches a single user's profile details.
 */
export const fetchUserProfile = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('phone, status, full_name')
            .eq('id', userId)
            .maybeSingle();
        
        if (error) throw error;
        return { profile: data, error: null };
    } catch (e: unknown) {
        return { profile: null, error: parseError(e) };
    }
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
    try {
        const { error } = await supabase
          .from('profiles')
          .update({ phone, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) throw error;
        return { error: null };
    } catch (e: unknown) {
        return { error: parseError(e) };
    }
};

/**
 * Updates the current user's profile details using a secure RPC.
 */
export const updateCurrentUserProfile = async (details: { name: string; phone: string }): Promise<{ error: string | null }> => {
    try {
        const { error } = await supabase.rpc('update_user_profile', {
            p_full_name: details.name,
            p_phone: details.phone
        });
        if (error) throw error;
        return { error: null };
    } catch (err: unknown) {
        return { error: parseError(err) };
    }
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
    } catch (err: unknown) {
        return { error: parseError(err) };
    }
};

/**
 * Fetches all bookings for the currently authenticated user.
 */
export const fetchUserBookings = async (): Promise<{ bookings: BookingDetail[]; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc('get_user_bookings');
    if (error) throw error;

    const bookings: BookingDetail[] = (data || []).map((b: any) => ({
      id: b.id,
      created_at: b.created_at,
      user_id: b.user_id,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      car_id: b.car_id,
      car_title: b.car_title,
      start_datetime: b.start_datetime,
      end_datetime: b.end_datetime,
      total_amount: b.total_amount,
      status: b.status,
      payment_mode: b.status === 'hold' ? 'hold' : 'full',
      hold_expires_at: b.hold_expires_at,
      booking_extensions: b.booking_extensions || [],
      cars: b.cars ? {
        id: b.cars.id,
        title: b.cars.title,
        make: b.cars.make,
        model: b.cars.model,
        year: b.cars.year,
        seats: b.cars.seats,
        fuelType: b.cars.fuel_type,
        transmission: b.cars.transmission,
        pricePerDay: b.cars.price_per_day,
        verified: b.cars.verified,
        status: b.cars.status,
        imagePaths: b.cars.image_paths || [],
        available: b.cars.available,
      } as Car : undefined,
      promo_code_id: b.promo_code_id,
      discount_amount: b.discount_amount,
    }));

    return { bookings, error: null };
  } catch (err: unknown) {
    return { bookings: [], error: parseError(err) };
  }
};


/**
 * Updates the status for a specific user in the profiles table.
 */
export const updateUserStatus = async (userId: string, status: UserStatus): Promise<{ error: string | null }> => {
    try {
        const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
        if (error) throw error;
        return { error: null };
    } catch (e: unknown) {
        return { error: parseError(e) };
    }
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
    } catch (err: unknown) {
        return { error: parseError(err) };
    }
};