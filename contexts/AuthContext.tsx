import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session, User, Role } from '../types';
import type { AuthError, AuthResponse, OAuthResponse, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
  loading: boolean;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<AuthResponse>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<OAuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndRole = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (roleError) {
          console.error("Error fetching initial user role:", roleError.message);
        }
        setRole(roleData?.role as Role ?? 'user'); // Default to 'user' if no role found
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
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roleError) {
          console.error("Error fetching user role on auth state change:", roleError.message);
        }
        
        const newRole = roleData?.role as Role ?? 'user';
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
    signOut: () => {
        setRole(null); // Clear role on sign out
        window.location.hash = '#/'; // Redirect to home on sign out
        return supabase.auth.signOut();
    },
    signInWithGoogle: (): Promise<OAuthResponse> => {
        return supabase.auth.signInWithOAuth({
          provider: 'google',
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