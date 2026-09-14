'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';

function RecuperarClaveForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = useSearchParams().get('token') || '';
  function submit(event: FormEvent) {
    event.preventDefault();
    setError(''); setLoading(true);
    apiFetch(token ? '/auth/reset-password' : '/auth/forgot-password', { method: 'POST', body: JSON.stringify(token ? { token, password } : { email }) })
      .then(() => token ? setDone(true) : setSent(true))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo completar la recuperación.'))
      .finally(() => setLoading(false));
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        {done ? <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Contraseña actualizada. Ya podés ingresar.</p> : sent ? <p className="mt-6 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Si el email existe, recibirás instrucciones para continuar.</p> : <>
          <p className="mt-2 text-sm text-slate-600">{token ? 'Elegí una contraseña nueva.' : 'Ingresá tu email y te enviaremos un enlace de recuperación.'}</p>
          {token ? <label className="mt-6 block text-sm font-medium">Nueva contraseña<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label> : <label className="mt-6 block text-sm font-medium">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>}
          {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
          <button disabled={loading} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{loading ? 'Procesando…' : token ? 'Cambiar contraseña' : 'Solicitar recuperación'}</button>
        </>}
        <Link href="/login" className="mt-5 block text-center text-sm text-blue-600">Volver al ingreso</Link>
      </form>
    </main>
  );
}

export default function RecuperarClavePage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><RecuperarClaveForm /></Suspense>;
}
