'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SocioSession } from '@/lib/api';

export function PortalRoleTabs({ session }: { session: SocioSession }) {
  const pathname = usePathname();
  const tabs = [
    ...(session.es_socio
      ? [{ href: '/socio', label: 'Perfil de socio' }]
      : []),
    ...(session.role === 'profe'
      ? [{ href: '/profe', label: 'Panel de profesor' }]
      : []),
  ];

  if (tabs.length < 2) return null;

  return (
    <nav className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? 'bg-[var(--primary,#003ec7)] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
