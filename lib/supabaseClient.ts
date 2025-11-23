import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT SETUP ---
// For local development or deployment, set these as environment variables.
// In Netlify, you can set these in Site settings > Build & deploy > Environment.
const SUPABASE_URL = 'https://rcpkhtlvfvafympulywx.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

export const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Check if the environment variables are set.
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Initialize the client only if the credentials have been properly set.
// The App component will display a configuration error message if they are missing.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {} as any; // Provide a dummy object to prevent import errors and allow the config check to run first.

if (!isSupabaseConfigured) {
  // This message will appear in the developer console to aid in setup.
  console.error('CRITICAL: Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. The application will not function.');
}
