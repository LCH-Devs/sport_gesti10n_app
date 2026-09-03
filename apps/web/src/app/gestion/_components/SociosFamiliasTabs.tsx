'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';

export function SociosFamiliasTabs() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const tabs = [
    { label: t('admin.socios.title'), href: '/socios' },
    { label: t('admin.familias.title'), href: '/familias' },
  ];

  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname === `/gestion${tab.href}`;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px rounded-t-lg border px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'border-slate-200 border-b-white bg-white text-slate-900'
                : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
