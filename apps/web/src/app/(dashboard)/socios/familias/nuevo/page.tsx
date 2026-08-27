'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';

type SocioMini = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
};

type Familia = {
  id: number;
  nombre: string;
  titular_id: number;
};

export default function FamiliaFormPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const familiaId = searchParams.get('id');

  const [socios, setSocios] = useState<SocioMini[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nombre: '', titular_id: '' });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const soc = await apiFetch<SocioMini[]>('/socios', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setSocios(soc);

      if (familiaId) {
        const familia = await apiFetch<Familia>(`/familias/${familiaId}`, {
          token: session.access_token,
          clubSlug: session.club.slug,
        });
        setForm({ nombre: familia.nombre, titular_id: String(familia.titular_id) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [familiaId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;

    setSubmitting(true);
    setError('');
    try {
      const body = {
        nombre: form.nombre,
        titular_id: Number(form.titular_id),
      };

      if (familiaId) {
        await apiFetch(`/familias/${familiaId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/familias', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(body),
        });
      }

      router.push('/socios?tab=familias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-slate-500">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {familiaId ? t('admin.familias.editFamilia', 'Editar Familia') : t('admin.familias.newFamilia', 'Nueva Familia')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {familiaId ? 'Actualiza los datos de la familia' : 'Ingresa los datos de la nueva familia'}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 max-w-md"
      >
        <label className="text-sm">
          {t('admin.familias.nombre')}
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
        </label>

        <label className="text-sm">
          {t('admin.familias.titular')}
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.titular_id}
            onChange={(e) => setForm((f) => ({ ...f, titular_id: e.target.value }))}
            required
          >
            <option value="">Elegir…</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.apellido}, {s.nombre} ({s.dni})
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.push('/socios?tab=familias')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? t('common.save') + '…' : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
