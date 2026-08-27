'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, CuentaOption, LoginResult } from '@/lib/api';
import { enterAfterLogin } from '@/lib/apply-login';
import { useTranslation } from '@/lib/useTranslation';

export default function ClubAccountSwitcher({
  token,
  cuentas,
  currentMembresiaId,
  paths,
}: {
  token: string;
  cuentas?: CuentaOption[];
  currentMembresiaId?: number;
  paths?: { staff?: string; member?: string; onboarding?: string };
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const others = (cuentas || []).filter(
    (c) => c.membresia_id !== currentMembresiaId,
  );
  if (others.length === 0) return null;

  async function switchTo(membresiaId: number) {
    setLoading(true);
    try {
      const data = await apiFetch<LoginResult>('/auth/switch', {
        method: 'POST',
        token,
        body: JSON.stringify({ membresia_id: membresiaId }),
      });
      enterAfterLogin(data, (href) => router.push(href), paths);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {t('entrar.switchAccount')}
      </button>
      {open && (
        <ul className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {others.map((cuenta) => (
            <li key={cuenta.membresia_id}>
              <button
                type="button"
                disabled={loading}
                onClick={() => void switchTo(cuenta.membresia_id)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="block font-medium text-slate-900">
                  {cuenta.club.nombre}
                </span>
                <span className="text-xs text-slate-500">{cuenta.rol}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
