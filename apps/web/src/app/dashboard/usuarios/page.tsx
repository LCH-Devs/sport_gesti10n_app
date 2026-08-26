'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

type AdminUser = {
  id: number;
  email: string;
  nombre: string;
  rol: string;
};

export default function UsuariosPage() {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    nombre: '',
    password: '',
    rol: 'admin',
  });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    try {
      const data = await apiFetch<AdminUser[]>('/admins', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setAdmins(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch('/admins', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(form),
      });
      setForm({ email: '', nombre: '', password: '', rol: 'admin' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  async function onDelete(id: number) {
    const session = getSession();
    if (!session || !confirm('¿Eliminar usuario?')) return;
    try {
      await apiFetch(`/admins/${id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.usuarios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.usuarios.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">{t('admin.usuarios.alta')}</h3>
        <label className="text-sm">
          {t('admin.usuarios.nombre')}
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.usuarios.email')}
          <input
            type="email"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.usuarios.password')}
          <input
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            required
            minLength={4}
          />
        </label>
        <label className="text-sm">
          {t('admin.usuarios.rol')}
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.rol}
            onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
          >
            <option value="admin">{t('dashboard.admin')}</option>
            <option value="entrada">{t('dashboard.entrada')}</option>
          </select>
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          {t('admin.usuarios.createUsuario')}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">{t('dashboard.name')}</th>
              <th className="px-4 py-3">{t('dashboard.email')}</th>
              <th className="px-4 py-3">{t('dashboard.role')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-3">{a.nombre}</td>
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3">{a.rol}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => void onDelete(a.id)}
                  >
                    {t('admin.socios.eliminar')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
