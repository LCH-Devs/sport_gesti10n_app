'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  applyClubTheme,
  ClubSession,
  saveSession,
  saveSocioSession,
  SocioSession,
} from '@/lib/api';

type Handoff = {
  next: string;
  kind: 'admin' | 'socio';
  payload: ClubSession | SocioSession;
};

export default function SesionPage() {
  const router = useRouter();

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) {
      router.replace('/entrar');
      return;
    }
    try {
      const data = JSON.parse(decodeURIComponent(raw)) as Handoff;
      if (data.kind === 'socio') {
        const session = data.payload as SocioSession;
        saveSocioSession(session);
        applyClubTheme(session.club);
      } else {
        const session = data.payload as ClubSession;
        saveSession(session);
        applyClubTheme(session.club);
      }
      window.history.replaceState(null, '', window.location.pathname);
      router.replace(data.next || '/');
    } catch {
      router.replace('/entrar');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-slate-500">
      Ingresando…
    </main>
  );
}
