'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

export default function NuevoEspacioPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'cancha',
    descripcion: '',
    duracion_slot_min: '60',
    precio_opcional: '',
    hora_apertura: '08:00',
    hora_cierre: '23:00',
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    try {
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
      router.push('/espacios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.socios.quickCreate')}</h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          label={t('admin.espacios.nombre')}
          value={form.nombre}
          onChange={(nombre) => setForm((f) => ({ ...f, nombre }))}
          required
        />
        <FormField
          label={t('admin.espacios.tipo')}
          value={form.tipo}
          onChange={(tipo) => setForm((f) => ({ ...f, tipo }))}
          required
          placeholder="padel, futbol, quincho…"
        />
        <FormField
          colSpan
          label={t('admin.espacios.descripcion')}
          value={form.descripcion}
          onChange={(descripcion) => setForm((f) => ({ ...f, descripcion }))}
        />
        <FormField
          type="number"
          min={15}
          label={t('admin.espacios.duracion')}
          value={form.duracion_slot_min}
          onChange={(duracion_slot_min) =>
            setForm((f) => ({ ...f, duracion_slot_min }))
          }
        />
        <FormField
          type="number"
          min={0}
          label={t('admin.espacios.precio')}
          value={form.precio_opcional}
          onChange={(precio_opcional) =>
            setForm((f) => ({ ...f, precio_opcional }))
          }
        />
        <FormField
          label={t('admin.espacios.apertura')}
          value={form.hora_apertura}
          onChange={(hora_apertura) => setForm((f) => ({ ...f, hora_apertura }))}
          placeholder="08:00"
        />
        <FormField
          label={t('admin.espacios.cierre')}
          value={form.hora_cierre}
          onChange={(hora_cierre) => setForm((f) => ({ ...f, hora_cierre }))}
          placeholder="23:00"
        />
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
          >
            {t('admin.espacios.createEspacio')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/espacios')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}
