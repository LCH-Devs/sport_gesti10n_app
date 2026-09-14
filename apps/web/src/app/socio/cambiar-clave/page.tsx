'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getSocioSession, saveSocioSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;

export default function CambiarClaveSocioPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = getSocioSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    if (!s.must_change_password) {
      router.replace('/socio');
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const s = getSocioSession();
    if (!s) return;
    if (!PASSWORD_REGEX.test(password)) {
      setError(t('cambiarClave.passwordRules'));
      return;
    }
    if (password !== confirm) {
      setError(t('cambiarClave.passwordMismatch'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/socio/me', {
        method: 'PATCH',
        token: s.access_token,
        clubSlug: s.club.slug,
        body: JSON.stringify({ currentPassword, newPassword: password }),
      });
      saveSocioSession({ ...s, must_change_password: false });
      router.replace('/socio');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cambiarClave.genericError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
      >
        <h1 className="text-center text-2xl font-bold text-slate-900">
          {t('cambiarClave.title')}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t('cambiarClave.subtitleSocio')}
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <label className="mt-6 block text-sm font-medium text-slate-700">
          {t('cambiarClave.currentPassword')}
          <input
            type="password"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          {t('cambiarClave.newPassword')}
          <input
            type="password"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          {t('cambiarClave.confirmPassword')}
          <input
            type="password"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? t('cambiarClave.saving') : t('cambiarClave.submit')}
        </button>
      </form>
    </main>
  );
}
