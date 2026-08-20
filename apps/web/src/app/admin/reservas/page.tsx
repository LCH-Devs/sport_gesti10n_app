'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type Reserva = {
  id: number;
  inicio: string;
  fin: string;
  estado: string;
  nota: string | null;
  socio: { id: number; nombre: string; apellido: string; dni: string };
  espacio: { id: number; nombre: string };
};

type Espacio = { id: number; nombre: string };
type Socio = { id: number; nombre: string; apellido: string; dni: string };

export default function ReservasPage() {
  const [items, setItems] = useState<Reserva[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    espacio_id: '',
    socio_id: '',
    inicio: '',
    fin: '',
  });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [reservas, esp, soc] = await Promise.all([
        apiFetch<Reserva[]>('/reservas', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Espacio[]>('/espacios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Socio[]>('/socios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setItems(reservas);
      setEspacios(esp);
      setSocios(soc);
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
      await apiFetch('/reservas', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          espacio_id: Number(form.espacio_id),
          socio_id: Number(form.socio_id),
          inicio: new Date(form.inicio).toISOString(),
          fin: new Date(form.fin).toISOString(),
        }),
      });
      setForm({ espacio_id: '', socio_id: '', inicio: '', fin: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  async function onCancelar(id: number) {
    const session = getSession();
    if (!session || !confirm('¿Cancelar reserva?')) return;
    try {
      await apiFetch(`/reservas/${id}/cancelar`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Reservas</h2>
      <p className="mt-1 text-sm text-slate-600">
        Listado y alta de reservas de espacios.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">Nueva reserva</h3>
        <label className="text-sm">
          Espacio
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.espacio_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, espacio_id: e.target.value }))
            }
            required
          >
            <option value="">Elegir…</option>
            {espacios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Socio
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.socio_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, socio_id: e.target.value }))
            }
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
        <label className="text-sm">
          Inicio
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.inicio}
            onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          Fin
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.fin}
            onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
            required
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          Crear reserva
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">Cargando…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Espacio</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{r.espacio.nombre}</td>
                  <td className="px-4 py-3">
                    {r.socio.apellido}, {r.socio.nombre}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.inicio).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.fin).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">{r.estado}</td>
                  <td className="px-4 py-3 text-right">
                    {r.estado === 'confirmada' && (
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => void onCancelar(r.id)}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-slate-500">
                    Sin reservas.
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
