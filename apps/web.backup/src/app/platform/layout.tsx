'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import {
  apiFetch,
  clearPlatformSession,
  getPlatformSession,
  PlatformSession,
} from '@/lib/api';

type ClubOption = {
  id: number;
  slug: string;
  nombre: string;
  activo: boolean;
};

const NAV = [
  {
    href: '/platform',
    label: 'Clubes',
    hint: 'Altas, precios y accesos',
    icon: IconBuilding,
  },
  {
    href: '/platform/usuarios',
    label: 'Superusuarios',
    hint: 'Cuentas internas',
    icon: IconUsers,
  },
];

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5H10v15H4Zm6 0V3.5A1.5 1.5 0 0 1 17.5 3H19a1.5 1.5 0 0 1 1.5 1.5V20H10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7 8.5h1M7 12h1M13.5 7h1M13.5 10.5h1M13.5 14h1M17 7h1M17 10.5h1M17 14h1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 19c.6-2.8 2.8-4.5 5.5-4.5s4.9 1.7 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16.2 14.6c1.9.3 3.5 1.5 4.3 3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return href === '/platform'
    ? pathname === '/platform'
    : pathname.startsWith(href);
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [clubId, setClubId] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/platform/login') {
      setSession(null);
      return;
    }
    const s = getPlatformSession();
    if (!s) {
      router.replace('/platform/login');
      return;
    }
    setSession(s);
    void apiFetch<ClubOption[]>('/platform/clubs', { token: s.access_token })
      .then((rows) => {
        setClubs(rows);
        setClubId((prev) => prev || (rows[0] ? String(rows[0].id) : ''));
      })
      .catch(() => setClubs([]));
  }, [router, pathname]);

  useEffect(() => {
    function refreshClubs() {
      const s = getPlatformSession();
      if (!s) return;
      void apiFetch<ClubOption[]>('/platform/clubs', { token: s.access_token })
        .then((rows) => {
          setClubs(rows);
          setClubId((prev) =>
            rows.some((c) => String(c.id) === prev)
              ? prev
              : rows[0]
                ? String(rows[0].id)
                : '',
          );
        })
        .catch(() => undefined);
    }
    window.addEventListener('platform-clubs-changed', refreshClubs);
    return () =>
      window.removeEventListener('platform-clubs-changed', refreshClubs);
  }, []);

  function openClubLogin(e: FormEvent) {
    e.preventDefault();
    const club = clubs.find((c) => String(c.id) === clubId);
    if (!club) return;
    window.open(`/login/${club.slug}`, '_blank', 'noopener,noreferrer');
  }

  if (pathname === '/platform/login') {
    return <>{children}</>;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Cargando…
      </div>
    );
  }

  const current = NAV.find((item) => isActive(pathname, item.href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white">
          CA
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Interno
          </p>
          <p className="text-base font-semibold text-white">ClubApp</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Panel
        </p>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>
                <span className="block font-medium">{item.label}</span>
                <span className="block text-xs text-slate-400">{item.hint}</span>
              </span>
            </Link>
          );
        })}

        <form
          onSubmit={openClubLogin}
          className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-3"
        >
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Entrar a un club
          </p>
          <label className="sr-only" htmlFor="club-jump">
            Club
          </label>
          <select
            id="club-jump"
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
          >
            {clubs.length === 0 && <option value="">Sin clubes</option>}
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.activo ? '' : ' (suspendido)'}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!clubId}
            className="mt-2 w-full rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-40"
          >
            Abrir login
          </button>
        </form>
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-medium text-white">
          {session.platform_admin.nombre}
        </p>
        <p className="truncate text-xs text-slate-400">
          {session.platform_admin.email}
        </p>
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
          onClick={() => {
            clearPlatformSession();
            router.push('/platform/login');
          }}
        >
          Salir
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 bg-slate-950 md:block">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative h-full w-72 bg-slate-950 shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-4 rounded-lg p-2 text-slate-300 hover:bg-white/10"
              onClick={() => setDrawerOpen(false)}
              aria-label="Cerrar"
            >
              <IconClose className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-8">
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Panel ClubApp
              </p>
              <h1 className="text-lg font-semibold text-slate-900">
                {current?.label ?? 'Plataforma'}
              </h1>
            </div>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
