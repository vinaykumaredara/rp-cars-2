import { supabase } from './supabaseClient';
import type { BookingDetail } from '../types';

export interface DashboardStats {
  total_cars: number;
  active_bookings: number;
  total_users: number;
}

export const fetchDashboardStats = async (): Promise<{ stats: DashboardStats | null; error: string | null }> => {
  try {
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
  } catch (e) {
    console.error('Unhandled error in fetchDashboardStats:', e);
    let errorMessage = 'An unknown error occurred while fetching dashboard stats.';
    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
        errorMessage = (e as { message: string }).message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { stats: null, error: errorMessage };
  }
};

export const fetchAllBookings = async (): Promise<{ bookings: BookingDetail[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        user_id,
        car_id,
        start_datetime,
        end_datetime,
        total_amount,
        status,
        hold_expires_at,
        users (
          full_name,
          phone
        ),
        cars (
          title
        ),
        booking_extensions (
            id,
            added_hours,
            requested_end,
            price,
            payment_status,
            created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all bookings:', error);
      return { bookings: [], error: `Failed to fetch bookings: ${error.message}` };
    }

    const formattedBookings: BookingDetail[] = (data || []).map((b: any) => ({
      id: b.id,
      created_at: b.created_at,
      user_id: b.user_id,
      customer_name: b.users?.full_name || null,
      customer_phone: b.users?.phone || null,
      car_id: b.car_id,
      car_title: b.cars?.title || null,
      start_datetime: b.start_datetime,
      end_datetime: b.end_datetime,
      total_amount: b.total_amount,
      status: b.status,
      hold_expires_at: b.hold_expires_at,
      payment_mode: b.status === 'hold' ? 'hold' : 'full', // Infer payment mode for UI
      booking_extensions: b.booking_extensions || [],
    }));

    return { bookings: formattedBookings, error: null };
  } catch (e) {
    console.error('Unhandled error in fetchAllBookings:', e);
    let errorMessage = 'An unknown error occurred while fetching bookings.';
    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
        errorMessage = (e as { message: string }).message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    }
    return { bookings: [], error: errorMessage };
  }
};