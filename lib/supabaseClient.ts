import { createClient } from '@supabase/supabase-js';

// Production-ready setup: Use environment variables for Supabase credentials.
// These variables MUST be configured in your hosting environment (e.g., Netlify, Vercel).
const supabaseUrl = process.env.SUPABASE_URL || 'https://rcpkhtlvfvafympulywx.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE';

if (supabaseUrl === 'https://rcpkhtlvfvafympulywx.supabase.co' && window.location.hostname !== 'localhost') {
    console.warn('WARNING: Using fallback Supabase URL. For production, please set the SUPABASE_URL environment variable.');
}
if (supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE' && window.location.hostname !== 'localhost') {
    console.warn('WARNING: Using fallback Supabase Anon Key. For production, please set the SUPABASE_ANON_KEY environment variable.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);