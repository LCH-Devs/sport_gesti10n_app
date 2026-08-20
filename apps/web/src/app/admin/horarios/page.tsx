'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type Horario = {
  id: number;
  titulo: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  profe_id: number | null;
  activo: boolean;
};

export default function HorariosPage() {
  const [items, setItems] = useState<Horario[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    titulo: '',
    dias: 'lun,mie,vie',
    hora_inicio: '18:00',
    hora_fin: '19:30',
  });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Horario[]>('/horarios', {
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
      await apiFetch('/horarios', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(form),
      });
      setForm({
        titulo: '',
        dias: 'lun,mie,vie',
        hora_inicio: '18:00',
        hora_fin: '19:30',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  async function onDelete(id: number) {
    const session = getSession();
    if (!session || !confirm('¿Eliminar horario?')) return;
    try {
      await apiFetch(`/horarios/${id}`, {
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
      <h2 className="text-2xl font-bold">Horarios</h2>
      <p className="mt-1 text-sm text-slate-600">
        Entrenamientos y actividades semanales. Días: lun,mar,mie,jue,vie,sab,dom.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">Alta rápida</h3>
        <label className="text-sm sm:col-span-2">
          Título
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          Días
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.dias}
            onChange={(e) => setForm((f) => ({ ...f, dias: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          Inicio
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.hora_inicio}
            onChange={(e) =>
              setForm((f) => ({ ...f, hora_inicio: e.target.value }))
            }
            required
          />
        </label>
        <label className="text-sm">
          Fin
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.hora_fin}
            onChange={(e) =>
              setForm((f) => ({ ...f, hora_fin: e.target.value }))
            }
            required
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          Crear horario
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">Cargando…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Días</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{h.titulo}</td>
                  <td className="px-4 py-3">{h.dias}</td>
                  <td className="px-4 py-3">
                    {h.hora_inicio} – {h.hora_fin}
                  </td>
                  <td className="px-4 py-3">{h.activo ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void onDelete(h.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-slate-500">
                    Sin horarios.
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
