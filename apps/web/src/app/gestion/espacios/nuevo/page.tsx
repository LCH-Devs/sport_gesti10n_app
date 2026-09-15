'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

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

function NuevoEspacioForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'cancha',
    descripcion: '',
    duracion_slot_min: '60',
    precio_opcional: '',
    hora_apertura: '08:00',
    hora_cierre: '23:00',
  });

  useEffect(() => {
    if (!editingId) return;
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    apiFetch<Espacio>(`/espacios/${editingId}`, {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((e) =>
        setForm({
          nombre: e.nombre,
          tipo: e.tipo,
          descripcion: e.descripcion || '',
          duracion_slot_min: String(e.duracion_slot_min),
          precio_opcional: e.precio_opcional != null ? String(e.precio_opcional) : '',
          hora_apertura: e.hora_apertura,
          hora_cierre: e.hora_cierre,
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : t('messages.errorLoading')))
      .finally(() => setLoading(false));
  }, [editingId, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion || undefined,
        duracion_slot_min: Number(form.duracion_slot_min) || 60,
        precio_opcional: form.precio_opcional
          ? Number(form.precio_opcional)
          : undefined,
        hora_apertura: form.hora_apertura,
        hora_cierre: form.hora_cierre,
      });
      if (editingId) {
        await apiFetch(`/espacios/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      } else {
        await apiFetch('/espacios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
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
      <div>
        <h2 className="text-2xl font-bold">
          {editingId ? t('admin.espacios.editEspacio') : t('admin.socios.quickCreate')}
        </h2>
        <p className="mt-6 text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editingId ? t('admin.espacios.editEspacio') : t('admin.socios.quickCreate')}
      </h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          label={t('admin.espacios.nombre')}
          value={form.nombre}
          onChange={(nombre) => setForm((f) => ({ ...f, nombre }))}
          required
        />
        <FormField
          as="select"
          label={t('admin.espacios.tipo')}
          value={form.tipo}
          onChange={(tipo) => setForm((f) => ({ ...f, tipo }))}
          required
        >
          <option value="cancha">{t('admin.espacios.tipoCancha', 'Cancha')}</option>
          <option value="padel">{t('admin.espacios.tipoPadel', 'Pádel')}</option>
          <option value="futbol">{t('admin.espacios.tipoFutbol', 'Fútbol')}</option>
          <option value="basquet">{t('admin.espacios.tipoBasquet', 'Básquet')}</option>
          <option value="tenis">{t('admin.espacios.tipoTenis', 'Tenis')}</option>
          <option value="quincho">{t('admin.espacios.tipoQuincho', 'Quincho')}</option>
          <option value="salon">{t('admin.espacios.tipoSalon', 'Salón')}</option>
          <option value="otro">{t('admin.espacios.tipoOtro', 'Otro')}</option>
        </FormField>
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
          type="time"
          label={t('admin.espacios.apertura')}
          value={form.hora_apertura}
          onChange={(hora_apertura) => setForm((f) => ({ ...f, hora_apertura }))}
          required
        />
        <FormField
          type="time"
          label={t('admin.espacios.cierre')}
          value={form.hora_cierre}
          onChange={(hora_cierre) => setForm((f) => ({ ...f, hora_cierre }))}
          required
        />
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? t('config.guardando') : editingId ? t('config.guardar') : t('admin.espacios.createEspacio')}
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

export default function NuevoEspacioPage() {
  return (
    <Suspense fallback={null}>
      <NuevoEspacioForm />
    </Suspense>
  );
}
