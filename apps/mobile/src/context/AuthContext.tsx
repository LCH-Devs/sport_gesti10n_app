import React, { createContext, useContext, useMemo, useState } from 'react';
import type { LoginResponse } from '@/lib/api';
import { loginSocio } from '@/lib/api';

type AuthContextValue = {
  session: LoginResponse | null;
  loading: boolean;
  signIn: (email: string, password: string, clubSlug?: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    signIn: async (email, password, clubSlug) => {
      setLoading(true);
      try {
        setSession(await loginSocio(email.trim(), password, clubSlug?.trim() || undefined));
      } finally {
        setLoading(false);
      }
    },
    signOut: () => setSession(null),
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
