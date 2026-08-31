'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getSession, saveSession } from '@/lib/api';
import { useChrome } from '@/lib/ChromeContext';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;
const PASSWORD_MESSAGE =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & * _ - + =)';

export default function CambiarClavePage() {
  const router = useRouter();
  const { setHideChrome } = useChrome();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHideChrome(true);
    return () => setHideChrome(false);
  }, [setHideChrome]);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    if (s.must_complete_onboarding) {
      router.replace('/gestion/onboarding');
      return;
    }
    if (!s.must_change_password) {
      router.replace('/gestion');
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const s = getSession();
    if (!s) return;
    if (!PASSWORD_REGEX.test(password)) {
      setError(PASSWORD_MESSAGE);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/admins/me', {
        method: 'PATCH',
        token: s.access_token,
        clubSlug: s.club.slug,
        body: JSON.stringify({ newPassword: password }),
      });
      saveSession({ ...s, must_change_password: false });
      router.replace('/gestion');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
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
          Elegí una contraseña nueva
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Tu club ya está configurado. Solo hace falta actualizar la clave
          temporal que te enviamos por correo.
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Nueva contraseña
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
          Confirmar contraseña
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
          {saving ? 'Guardando…' : 'Guardar e ingresar'}
        </button>
      </form>
    </main>
  );
}
