import { supabase } from './supabaseClient';
// FIX: The DashboardStats type is defined locally in this file, so it should not be imported from `../types`.
import type { BookingDetail } from '../types';

export interface DashboardStats {
  total_cars: number;
  active_bookings: number;
  total_users: number;
}

export const fetchDashboardStats = async (): Promise<{ stats: DashboardStats | null; error: string | null }> => {
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    console.error('Error fetching dashboard stats:', error);
    // Add specific error message for missing function, which guides the admin to the fix.
    if (error.code === '42883' || error.message.includes('Could not find the function')) {
        return { stats: null, error: "Backend not configured: The 'get_dashboard_stats' function is missing. Please run the setup script from the User Management page to create it." };
    }
    return { stats: null, error: `Failed to fetch dashboard stats: ${error.message}` };
  }

  return { stats: data, error: null };
};

export const fetchAllBookings = async (): Promise<{ bookings: BookingDetail[]; error: string | null }> => {
  const { data, error } = await supabase.rpc('get_all_bookings');

  if (error) {
    console.error('Error fetching all bookings:', error);
    if (error.code === '42883' || error.message.includes('Could not find the function')) {
      return { bookings: [], error: "Backend not configured: The 'get_all_bookings' function is missing. Please run the setup script from the User Management page." };
    }
    return { bookings: [], error: `Failed to fetch bookings: ${error.message}` };
  }

  return { bookings: data || [], error: null };
};