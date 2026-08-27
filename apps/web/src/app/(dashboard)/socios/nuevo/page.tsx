'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

type Socio = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
};

const EMPTY_FORM = {
  dni: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
};

export default function NuevoSocioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const editId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(editId ? true : false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;

    const loadSocio = async () => {
      const session = getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const socio = await apiFetch<Socio>(`/socios/${editId}`, {
          token: session.access_token,
          clubSlug: session.club.slug,
        });
        setForm({
          dni: socio.dni,
          nombre: socio.nombre,
          apellido: socio.apellido,
          email: socio.email,
          telefono: socio.telefono,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('messages.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    void loadSocio();
  }, [editId, router, t]);

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
      if (editId) {
        await apiFetch(`/socios/${editId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/socios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(form),
        });
      }
      router.push('/socios');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editId ? t('admin.socios.editSocio') : t('admin.socios.newSocio')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {editId
          ? t('admin.socios.subtitle')
          : t('admin.socios.createSubtitle', 'Ingresa los datos del nuevo socio')}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        {(
          [
            ['dni', t('admin.socios.dni')],
            ['nombre', t('admin.socios.nombre')],
            ['apellido', t('admin.socios.apellido')],
            ['email', t('admin.socios.email')],
            ['telefono', t('admin.socios.telefono')],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required={key !== 'telefono'}
              type={key === 'email' ? 'email' : 'text'}
            />
          </label>
        ))}

        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? t('newClub.saving', 'Guardando…')
              : editId
                ? t('common.save', 'Guardar')
                : t('admin.socios.createSocio')}
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
