import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder values if environment variables are not set.
// You MUST replace these with your actual Supabase project URL and Anon key in the environment settings.
const placeholderUrl = 'https://example.supabase.co';
const placeholderAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImV4cCI6MTk4Mzg4ODAwMH0.dummy-key-for-local-development';

const supabaseUrl = process.env.SUPABASE_URL || placeholderUrl;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || placeholderAnonKey;

if (supabaseUrl === placeholderUrl) {
    console.warn("Supabase environment variables are not set. The app is using placeholder credentials. Please provide your own SUPABASE_URL and SUPABASE_ANON_KEY for the application to function correctly.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);