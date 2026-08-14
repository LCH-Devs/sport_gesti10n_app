'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  PlatformSession,
  savePlatformSession,
} from '@/lib/api';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<PlatformSession>('/auth/platform/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      savePlatformSession(data);
      router.push('/platform');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white">
            CA
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Interno
            </p>
            <p className="text-sm font-semibold text-slate-900">ClubApp</p>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Panel de superusuario
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Acceso interno. Los clubes entran por su propio link.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Contraseña
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-16 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
              {showPassword ? 'Ocultar' : 'Ver'}
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
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Ingresando…' : 'Entrar al panel'}
        </button>
      </form>
    </main>
  );
}
