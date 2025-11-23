import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Session, User, Role } from '../types';
import type { AuthResponse, OAuthResponse, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { useToast } from './ToastContext';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
  loading: boolean;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<AuthResponse>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<OAuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    // If Supabase is not configured, do not attempt to interact with it.
    // Set loading to false so the App component can render the configuration error message.
    if (!isSupabaseConfigured) {
        setLoading(false);
        return;
    }

    const getSessionAndRole = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use RPC to securely fetch the role, bypassing RLS issues.
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role', { p_user_id: session.user.id });
        
        if (roleError) {
          console.error("Error fetching initial user role via RPC:", roleError.message);
        }
        // roleData will be a string (the role) or null/undefined
        setRole(roleData as Role ?? 'user'); // Default to 'user' if no role found
      } else {
        setRole(null);
      }
      setLoading(false);
    };
    
    getSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch role on sign-in or session refresh
        setLoading(true);
        // Use RPC to securely fetch the role, bypassing RLS issues.
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role', { p_user_id: session.user.id });

        if (roleError) {
          console.error("Error fetching user role on auth state change via RPC:", roleError.message);
        }
        
        const newRole = roleData as Role ?? 'user';
        setRole(newRole);
        
        // Redirect admin on sign-in using SPA-friendly navigation
        if (_event === 'SIGNED_IN' && newRole === 'admin') {
            if (!window.location.hash.startsWith('#/admin')) {
                window.location.hash = '#/admin';
            }
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
        // The onAuthStateChange listener will handle clearing the session/user state.
        // We just need to navigate the user and provide feedback.
        window.location.hash = '#/';
        addToast('You have been successfully signed out.', 'success');
    } catch (error: any) {
        console.error('Error signing out:', error);
        addToast(`Sign out failed: ${error.message || 'Unknown error'}`, 'error');
        // As a safety measure, still attempt to navigate home.
        window.location.hash = '#/';
    }
  }, [addToast]);

  const value: AuthContextType = {
    session,
    user,
    role,
    loading,
    signIn: (credentials: SignInWithPasswordCredentials): Promise<AuthResponse> => {
        return supabase.auth.signInWithPassword(credentials);
    },
    signUp: (credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> => {
        return supabase.auth.signUp(credentials);
    },
    signOut,
    signInWithGoogle: (): Promise<OAuthResponse> => {
        // IMPORTANT FOR PRODUCTION DEPLOYMENT:
        // For Google OAuth to redirect back to your app correctly, you must configure
        // the "Site URL" in your Supabase project's Authentication settings.
        // Go to: Supabase Dashboard > Authentication > Settings > Site URL
        // Set this to your production domain (e.g., https://www.your-app.com).
        // You may also need to add your domain to the "Redirect URIs" in the Google Cloud Console.
        return supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // By removing `redirectTo`, Supabase will default to the Site URL configured in your dashboard.
            // This is more robust and prevents potential mismatches with `window.location.origin`.
            skipBrowserRedirect: true,
          },
        });
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};