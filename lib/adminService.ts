import { supabase } from './supabaseClient';
import type { BookingDetail } from '../types';
import { parseError } from './errorUtils';

export interface DashboardStats {
  total_cars: number;
  active_bookings: number;
  total_users: number;
}

export const fetchDashboardStats = async (): Promise<{ stats: DashboardStats | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
      // Add specific error message for missing function, which guides the admin to the fix.
      if (error.code === '42883' || error.message.includes('Could not find the function')) {
          return { stats: null, error: "Backend not configured: The 'get_dashboard_stats' function is missing. Please run the setup script from the User Management page to create it." };
      }
      throw error;
    }

    return { stats: data, error: null };
  } catch (e: unknown) {
    return { stats: null, error: parseError(e) };
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
        promo_code_id,
        discount_amount,
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

    if (error) throw error;

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
      promo_code_id: b.promo_code_id,
      discount_amount: b.discount_amount,
    }));

    return { bookings: formattedBookings, error: null };
  } catch (e: unknown) {
    return { bookings: [], error: parseError(e) };
  }
};