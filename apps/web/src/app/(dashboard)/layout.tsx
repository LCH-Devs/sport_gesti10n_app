'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import {
  applyClubTheme,
  clearSession,
  ClubSession,
  getSession,
  mediaUrl,
} from '@/lib/api';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<ClubSession | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    applyClubTheme(s.club);
    if (s.must_complete_onboarding && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }
    setSession(s);
  }, [router, pathname]);

  useEffect(() => {
    function sync() {
      const next = getSession();
      if (next) setSession(next);
    }
    window.addEventListener('club-session-changed', sync);
    return () => window.removeEventListener('club-session-changed', sync);
  }, []);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Cargando…
      </div>
    );
  }

  const onboarding = !!session.must_complete_onboarding;
  const loginHref = `/login/${session.club.slug}`;

  return (
    <div>
      {session.impersonated_by_platform && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Modo soporte (pass maestra) — no uses esto para operar el negocio del
          club.
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
