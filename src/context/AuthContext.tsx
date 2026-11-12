import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

  // Id do usuário cujo perfil já está carregado (ou sendo carregado). Evita
  // buscar o mesmo perfil várias vezes: o Supabase emite INITIAL_SESSION e,
  // às vezes, SIGNED_IN repetido ao voltar o foco para a aba.
  const loadedUidRef = useRef<string | null>(null);

  const loadUserData = async (currentSession: Session | null) => {
    if (currentSession?.user) {
      setSession(currentSession);
      const uid = currentSession.user.id;
      if (loadedUidRef.current === uid) return;
      loadedUidRef.current = uid;
      const profile = await fetchProfileWithRetry(uid);
      if (loadedUidRef.current !== uid) return; // sessão mudou durante a busca
      if (profile) {
        setUser(profile);
      } else {
        console.error('Failed to load profile for user ID:', uid);
        loadedUidRef.current = null;
        setUser(null);
      }
    } else {
      loadedUidRef.current = null;
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
    loadedUidRef.current = null;
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
    // onAuthStateChange já emite INITIAL_SESSION com a sessão salva, então não
    // é preciso chamar getSession() à parte (isso duplicava a busca do perfil).
    // As consultas são adiadas com setTimeout para não rodar dentro do callback
    // do Supabase, o que pode travar o cliente de autenticação.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, changedSession) => {
      if (event === 'TOKEN_REFRESHED') {
        setSession(changedSession);
        return;
      }
      setTimeout(() => loadUserData(changedSession), 0);
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
