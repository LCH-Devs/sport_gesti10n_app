import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { LoginResponse } from '@/lib/api';
import { changePassword, completeOnboarding, isStaffRole, login, setUnauthorizedHandler, switchCuenta } from '@/lib/api';
import { clearSession, loadSession, saveSession } from '@/lib/session-storage';

type AuthContextValue = {
  session: LoginResponse | null;
  /** true mientras se restaura la sesión guardada al abrir la app */
  restoring: boolean;
  /** true durante una operación de red (login, switch, cambio de clave) */
  loading: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string, clubSlug?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchAccount: (membresiaId: number) => Promise<void>;
  completeChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  completeClubOnboarding: (input: Parameters<typeof completeOnboarding>[1]) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null);
      clearSession().catch(() => {});
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    restoring,
    loading,
    isStaff: isStaffRole(session?.role),
    signIn: async (email, password, clubSlug) => {
      setLoading(true);
      try {
        const result = await login(email.trim(), password, clubSlug?.trim() || undefined);
        await saveSession(result);
        setSession(result);
      } finally {
        setLoading(false);
      }
    },
    signOut: async () => {
      await clearSession();
      setSession(null);
    },
    switchAccount: async (membresiaId) => {
      if (!session) return;
      setLoading(true);
      try {
        const result = await switchCuenta(session.access_token, membresiaId);
        await saveSession(result);
        setSession(result);
      } finally {
        setLoading(false);
      }
    },
    completeChangePassword: async (currentPassword, newPassword) => {
      if (!session) return;
      setLoading(true);
      try {
        await changePassword(session.access_token, session.role, currentPassword, newPassword);
        const updated = { ...session, must_change_password: false };
        await saveSession(updated);
        setSession(updated);
      } finally {
        setLoading(false);
      }
    },
    completeClubOnboarding: async (input) => {
      if (!session || !isStaffRole(session.role)) return;
      setLoading(true);
      try {
        const club = await completeOnboarding(session.access_token, input);
        const updated = { ...session, must_complete_onboarding: false, must_change_password: false, club: { ...session.club, ...club } };
        await saveSession(updated);
        setSession(updated);
      } finally {
        setLoading(false);
      }
    },
  }), [loading, restoring, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
