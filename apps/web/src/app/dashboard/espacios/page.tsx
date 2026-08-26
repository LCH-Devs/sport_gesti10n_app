'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

type Espacio = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  activo: boolean;
  duracion_slot_min: number;
  precio_opcional: number | null;
  hora_apertura: string;
  hora_cierre: string;
};

export default function EspaciosPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Espacio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'cancha',
    descripcion: '',
    duracion_slot_min: '60',
    precio_opcional: '',
    hora_apertura: '08:00',
    hora_cierre: '23:00',
  });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Espacio[]>('/espacios', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setItems(data);
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
    const session = getSession();
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
      setForm({
        nombre: '',
        tipo: 'cancha',
        descripcion: '',
        duracion_slot_min: '60',
        precio_opcional: '',
        hora_apertura: '08:00',
        hora_cierre: '23:00',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.espacios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.espacios.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">{t('admin.socios.quickCreate')}</h3>
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
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          {t('admin.espacios.createEspacio')}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('admin.espacios.nombre')}</th>
                <th className="px-4 py-3">{t('admin.espacios.tipo')}</th>
                <th className="px-4 py-3">{t('admin.espacios.slot')}</th>
                <th className="px-4 py-3">{t('admin.espacios.horario')}</th>
                <th className="px-4 py-3">{t('admin.espacios.activo')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{e.nombre}</td>
                  <td className="px-4 py-3">{e.tipo}</td>
                  <td className="px-4 py-3">{e.duracion_slot_min} min</td>
                  <td className="px-4 py-3">
                    {e.hora_apertura} – {e.hora_cierre}
                  </td>
                  <td className="px-4 py-3">{e.activo ? 'Sí' : 'No'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-slate-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
