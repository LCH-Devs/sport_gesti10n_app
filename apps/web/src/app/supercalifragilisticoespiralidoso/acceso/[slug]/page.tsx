'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  apiFetch,
  applyClubTheme,
  ClubLoginBranding,
  ClubSession,
  mediaUrl,
  saveSession,
} from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

export default function ClubLoginPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { t } = useTranslation();
  const [club, setClub] = useState<ClubLoginBranding | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClub, setLoadingClub] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<ClubLoginBranding>(`/clubs/slug/${slug}`);
        if (cancelled) return;
        if (!data.activo) {
          setError(t('login.clubSuspended'));
          return;
        }
        setClub(data);
        applyClubTheme(data);
      } catch {
        if (!cancelled) setError(t('login.clubNotFound'));
      } finally {
        if (!cancelled) setLoadingClub(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<ClubSession>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          club_slug: slug,
          email,
          password,
        }),
      });
      saveSession(data);
      applyClubTheme(data.club);
      router.push(
        data.must_complete_onboarding ? '/supercalifragilisticoespiralidoso/gestion/onboarding' : '/supercalifragilisticoespiralidoso/gestion',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreating'));
    } finally {
      setLoading(false);
    }
  }

  if (loadingClub) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        {t('common.loading')}
      </main>
    );
  }

  if (!club) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-red-600">{error || t('login.clubNotFound')}</p>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: `linear-gradient(160deg, ${club.color_primario}22, #f8fafc)`,
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        {club.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(club.logo_url)}
            alt={club.nombre}
            className="mx-auto mb-4 h-16 object-contain"
          />
        ) : (
          <p className="text-center text-sm font-medium text-slate-500">
            ClubApp Arg
          </p>
        )}
        <h1 className="mt-1 text-center text-2xl font-bold text-slate-900">
          {club.nombre}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t('login.subtitle')}
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
          className="mt-6 w-full rounded-lg px-4 py-2.5 font-semibold text-white disabled:opacity-60"
          style={{ background: club.color_primario }}
        >
          {loading ? t('login.signing') : t('login.signin')}
        </button>
      </form>
    </main>
  );
}
