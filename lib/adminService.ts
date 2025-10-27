import { supabase } from './supabaseClient';

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
