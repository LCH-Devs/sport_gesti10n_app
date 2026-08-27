'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

type Espacio = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  duracion_slot_min: number;
  precio_opcional: number | null;
  hora_apertura: string;
  hora_cierre: string;
};

const EMPTY_FORM = {
  nombre: '',
  tipo: 'cancha',
  descripcion: '',
  duracion_slot_min: '60',
  precio_opcional: '',
  hora_apertura: '08:00',
  hora_cierre: '23:00',
};

export default function NuevoEspacioPage() {
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

    const loadEspacio = async () => {
      const session = getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const espacio = await apiFetch<Espacio>(`/espacios/${editId}`, {
          token: session.access_token,
          clubSlug: session.club.slug,
        });
        setForm({
          nombre: espacio.nombre,
          tipo: espacio.tipo,
          descripcion: espacio.descripcion || '',
          duracion_slot_min: String(espacio.duracion_slot_min),
          precio_opcional: espacio.precio_opcional ? String(espacio.precio_opcional) : '',
          hora_apertura: espacio.hora_apertura,
          hora_cierre: espacio.hora_cierre,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('messages.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    void loadEspacio();
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
        await apiFetch(`/espacios/${editId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify({
            nombre: form.nombre,
            tipo: form.tipo,
            descripcion: form.descripcion || undefined,
            duracion_slot_min: Number(form.duracion_slot_min) || 60,
            precio_opcional: form.precio_opcional
              ? Number(form.precio_opcional)
              : undefined,
            hora_apertura: form.hora_apertura,
            hora_cierre: form.hora_cierre,
          }),
        });
      } else {
        await apiFetch('/espacios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify({
            nombre: form.nombre,
            tipo: form.tipo,
            descripcion: form.descripcion || undefined,
            duracion_slot_min: Number(form.duracion_slot_min) || 60,
            precio_opcional: form.precio_opcional
              ? Number(form.precio_opcional)
              : undefined,
            hora_apertura: form.hora_apertura,
            hora_cierre: form.hora_cierre,
          }),
        });
      }
      router.push('/espacios');
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
        {editId ? t('admin.espacios.editEspacio') : t('admin.espacios.newEspacio')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {editId
          ? t('admin.espacios.subtitle')
          : t('admin.espacios.createSubtitle', 'Ingresa los datos del nuevo espacio')}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          {t('admin.espacios.nombre')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.espacios.tipo')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            required
            placeholder="padel, futbol, quincho…"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          {t('admin.espacios.descripcion')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.descripcion}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion: e.target.value }))
            }
          />
        </label>
        <label className="text-sm">
          {t('admin.espacios.duracion')}
          <input
            type="number"
            min={15}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.duracion_slot_min}
            onChange={(e) =>
              setForm((f) => ({ ...f, duracion_slot_min: e.target.value }))
            }
          />
        </label>
        <label className="text-sm">
          {t('admin.espacios.precio')}
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.precio_opcional}
            onChange={(e) =>
              setForm((f) => ({ ...f, precio_opcional: e.target.value }))
            }
          />
        </label>
        <label className="text-sm">
          {t('admin.espacios.apertura')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.hora_apertura}
            onChange={(e) =>
              setForm((f) => ({ ...f, hora_apertura: e.target.value }))
            }
            placeholder="08:00"
          />
        </label>
        <label className="text-sm">
          {t('admin.espacios.cierre')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.hora_cierre}
            onChange={(e) =>
              setForm((f) => ({ ...f, hora_cierre: e.target.value }))
            }
            placeholder="23:00"
          />
        </label>

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
                : t('admin.espacios.createEspacio')}
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
