'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import {
  applyClubTheme,
  clearSession,
  ClubSession,
  getSession,
  mediaUrl,
} from '@/lib/api';
import ClubAccountSwitcher from '@/components/ClubAccountSwitcher';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<ClubSession | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/acceso');
      return;
    }
    applyClubTheme(s.club);
    if (s.must_complete_onboarding && pathname !== '/gestion/onboarding') {
      router.replace('/gestion/onboarding');
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
  const loginHref = '/acceso';

  const nav = [
    { href: '/gestion', label: 'Inicio' },
    { href: '/gestion/socios', label: 'Socios' },
    { href: '/gestion/cobros', label: 'Cobros' },
    { href: '/gestion/usuarios', label: 'Usuarios' },
    { href: '/gestion/espacios', label: 'Espacios' },
    { href: '/gestion/reservas', label: 'Reservas' },
    { href: '/gestion/horarios', label: 'Horarios' },
    { href: '/gestion/noticias', label: 'Noticias' },
    { href: '/gestion/config', label: 'Config' },
    { href: '/gestion/fuga', label: 'Fuga' },
    { href: '/gestion/familias', label: 'Familias' },
    { href: '/gestion/actividades', label: 'Actividades' },
    { href: '/gestion/torneos', label: 'Torneos' },
    { href: '/gestion/liquidaciones', label: 'Liquidaciones' },
  ];

  return (
    <div className="min-h-screen">
      {session.impersonated_by_platform && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Modo soporte (pass maestra) — no uses esto para operar el negocio del
          club.
        </div>
      )}
      <header
        className="border-b border-slate-200 bg-white"
        style={{ borderTop: `4px solid ${session.club.color_primario}` }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {session.club.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(session.club.logo_url)}
                alt=""
                className="h-10 w-10 rounded object-contain"
              />
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                ClubApp Arg
              </p>
              <h1 className="text-lg font-bold text-slate-900">
                {session.club.nombre}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ClubAccountSwitcher
              token={session.access_token}
              cuentas={session.cuentas}
              currentMembresiaId={session.admin.id}
            />
            <span className="text-slate-600">{session.admin.nombre}</span>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5"
              onClick={() => {
                clearSession();
                router.push(loginHref);
              }}
            >
              Salir
            </button>
          </div>
        </div>
        {!onboarding && (
          <nav className="mx-auto flex max-w-5xl flex-wrap gap-1 px-4 pb-3">
            {nav.map((item) => {
              const active =
                item.href === '/gestion'
                  ? pathname === '/gestion'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active
                      ? 'bg-[var(--club-primary)] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
