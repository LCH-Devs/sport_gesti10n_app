'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch, getPlatformSession } from '@/lib/api';

type Superuser = {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
  created_at: string;
};

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<Superuser[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
  });

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Superuser[]>('/platform/admins', {
        token: session.access_token,
      });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = getPlatformSession();
    if (!session) return;
    setError('');
    setOk('');
    try {
      await apiFetch('/platform/admins', {
        method: 'POST',
        token: session.access_token,
        body: JSON.stringify(form),
      });
      setOk(`Superusuario creado: ${form.email}`);
      setForm({ nombre: '', email: '', password: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  async function toggleActivo(user: Superuser) {
    const session = getPlatformSession();
    if (!session) return;
    setError('');
    setOk('');
    try {
      await apiFetch(`/platform/admins/${user.id}`, {
        method: 'PATCH',
        token: session.access_token,
        body: JSON.stringify({ activo: !user.activo }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  }

  const activos = users.filter((u) => u.activo).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Equipo interno
        </p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{activos}</p>
        <p className="mt-1 text-sm text-slate-500">
          superusuarios activos · {users.length} en total
        </p>
      </div>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {ok}
        </p>
      )}

      <form
        onSubmit={onCreate}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Nuevo superusuario
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cuentas de ClubApp. No pertenecen a un club.
          </p>
        </div>
        <label className="text-sm font-medium text-slate-700">
          Nombre
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Contraseña (mín. 8)
          <input
            type="password"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Crear superusuario
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-slate-500">Cargando…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {u.nombre}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{u.email}</td>
                  <td className="px-5 py-4">
                    {u.activo ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => void toggleActivo(u)}
                    >
                      {u.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
