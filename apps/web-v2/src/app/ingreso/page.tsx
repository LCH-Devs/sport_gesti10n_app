'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, LoginResult } from '@/lib/api';
import { enterAfterLogin, V2_LOGIN_PATHS } from '@/lib/apply-login';
import { parseTenantHost } from '@/lib/tenant-host';
import { useTranslation } from '@/lib/useTranslation';

function hostClubSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const base =
    process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ||
    (window.location.hostname === 'localhost' ||
    window.location.hostname.endsWith('.localhost')
      ? 'localhost'
      : undefined);
  return parseTenantHost(window.location.host, base).slug;
}

export default function IngresoPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSlug(hostClubSlug());
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<LoginResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          ...(slug ? { club_slug: slug } : {}),
        }),
      });
      enterAfterLogin(data, (href) => router.push(href), V2_LOGIN_PATHS);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <p className="text-center text-sm font-medium text-slate-500">
          ClubApp Arg
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold text-slate-900">
          {t('entrar.title')}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t('entrar.loginHint')}
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          {t('login.email')}
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          {t('login.password')}
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? t('login.hide') : t('login.show')}
            </button>
          </div>
        </label>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? t('login.signing') : t('login.signin')}
        </button>
        {!slug && (
          <p className="mt-4 text-center">
            <Link href="/inicio" className="text-sm text-blue-700 hover:underline">
              {t('entrar.back')}
            </Link>
          </p>
        )}
      </form>
    </main>
  );
}
