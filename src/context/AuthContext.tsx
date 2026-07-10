import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export interface Profile {
  id: string;
  nome: string;
  matricula: string;
  email: string;
  perfil: UserProfile;
}

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bypass de login apenas em ambientes de preview do Lovable (nunca em produção
  // publicada nem em build local que não seja preview). Permite editar o hero
  // sem precisar autenticar.
  const isLovablePreview = typeof window !== 'undefined' && (() => {
    const h = window.location.hostname;
    return (
      h.startsWith('id-preview--') ||
      h.startsWith('preview--') ||
      h.endsWith('.lovableproject.com') ||
      h.endsWith('.lovable.dev') ||
      h === 'localhost' ||
      h === '127.0.0.1'
    );
  })();

  const PREVIEW_USER: Profile = {
    id: 'preview-user',
    nome: 'Preview Admin',
    matricula: '000.000.000-00',
    email: 'preview@lovable.dev',
    perfil: 'Admin' as UserProfile,
  };

  // Robust profile loader with retry to handle database trigger delay on signup
  const fetchProfileWithRetry = async (uid: string, retries = 5, delay = 300): Promise<Profile | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle();
        
        if (data) {
          return data as Profile;
        }
        if (error) {
          console.warn(`Retry ${i + 1}/${retries} failed to fetch profile:`, error.message);
        }
      } catch (err) {
        console.error(`Error in fetchProfile retry ${i + 1}:`, err);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return null;
  };

  const loadUserData = async (currentSession: Session | null) => {
    if (currentSession?.user) {
      setSession(currentSession);
      const profile = await fetchProfileWithRetry(currentSession.user.id);
      if (profile) {
        setUser(profile);
      } else {
        console.error('Failed to load profile for user ID:', currentSession.user.id);
        setUser(null);
      }
    } else {
      setSession(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const profile = await fetchProfileWithRetry(session.user.id, 2, 200);
      if (profile) {
        setUser(profile);
      }
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      loadUserData(activeSession);
    });

    // Listen for auth changes — avoid unnecessary profile re-fetches on token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, changedSession) => {
      if (event === 'TOKEN_REFRESHED') {
        // Token was auto-refreshed (e.g. tab regained focus). Update the session
        // reference only — the user profile hasn't changed, so skip the DB round-trip
        // to avoid cascading re-renders / full-page loading flickers.
        setSession(changedSession);
        return;
      }
      loadUserData(changedSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
