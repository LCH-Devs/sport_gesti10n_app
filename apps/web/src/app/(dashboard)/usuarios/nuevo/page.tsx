'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

const EMPTY_FORM = {
  email: '',
  nombre: '',
  password: '',
  rol: 'admin',
};

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch('/admins', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(form),
      });
      router.push('/usuarios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.usuarios.alta')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t(
          'admin.usuarios.subtitle',
          'Completa los datos para crear un nuevo usuario',
        )}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          {t('admin.usuarios.nombre')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) =>
              setForm((current) => ({ ...current, nombre: e.target.value }))
            }
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.usuarios.email')}
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.email}
            onChange={(e) =>
              setForm((current) => ({ ...current, email: e.target.value }))
            }
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.usuarios.password')}
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.password}
            onChange={(e) =>
              setForm((current) => ({ ...current, password: e.target.value }))
            }
            required
            minLength={4}
          />
        </label>
        <label className="text-sm">
          {t('admin.usuarios.rol')}
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.rol}
            onChange={(e) =>
              setForm((current) => ({ ...current, rol: e.target.value }))
            }
          >
            <option value="admin">{t('dashboard.admin')}</option>
            <option value="entrada">{t('dashboard.entrada')}</option>
          </select>
        </label>

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? t('newClub.saving', 'Guardando…')
              : t('admin.usuarios.createUsuario')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}
