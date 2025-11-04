
import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// The Supabase URL and anonymous key are hardcoded below to ensure the application
// runs correctly in the current development environment.
// For production deployments, it is STRONGLY recommended to use environment variables
// to protect your credentials, as exposing them in client-side code is a security risk.
/*
  // Example for production using environment variables:
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
  }
*/

const supabaseUrl = 'https://rcpkhtlvfvafympulywx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are not set. Please check lib/supabaseClient.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
