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
      router.replace('/login');
      return;
    }
    applyClubTheme(s.club);
    if (s.must_complete_onboarding && pathname !== '/admin/onboarding') {
      router.replace('/admin/onboarding');
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
  const loginHref = '/login';

  const nav = [
    { href: '/admin', label: 'Inicio' },
    { href: '/admin/socios', label: 'Socios' },
    { href: '/admin/cobros', label: 'Cobros' },
    { href: '/admin/usuarios', label: 'Usuarios' },
    { href: '/admin/espacios', label: 'Espacios' },
    { href: '/admin/reservas', label: 'Reservas' },
    { href: '/admin/horarios', label: 'Horarios' },
    { href: '/admin/noticias', label: 'Noticias' },
    { href: '/admin/config', label: 'Config' },
    { href: '/admin/fuga', label: 'Fuga' },
    { href: '/admin/familias', label: 'Familias' },
    { href: '/admin/actividades', label: 'Actividades' },
    { href: '/admin/torneos', label: 'Torneos' },
    { href: '/admin/liquidaciones', label: 'Liquidaciones' },
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
                item.href === '/admin'
                  ? pathname === '/admin'
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
