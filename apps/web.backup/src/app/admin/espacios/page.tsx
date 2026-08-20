'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';

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
      <h2 className="text-2xl font-bold">Espacios</h2>
      <p className="mt-1 text-sm text-slate-600">
        Canchas, quinchos y otros espacios reservables.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">Alta rápida</h3>
        <label className="text-sm">
          Nombre
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          Tipo
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            required
            placeholder="padel, futbol, quincho…"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Descripción
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.descripcion}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion: e.target.value }))
            }
          />
        </label>
        <label className="text-sm">
          Duración slot (min)
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
          Precio opcional
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
          Apertura
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
          Cierre
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
          Crear espacio
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">Cargando…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Activo</th>
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
                    Sin espacios.
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
