'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';

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
  titular: SocioMini;
  socios: SocioMini[];
};

export default function FamiliasPage() {
  const [items, setItems] = useState<Familia[]>([]);
  const [socios, setSocios] = useState<SocioMini[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', titular_id: '' });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [familias, soc] = await Promise.all([
        apiFetch<Familia[]>('/familias', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<SocioMini[]>('/socios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setItems(familias);
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
      await apiFetch('/familias', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          nombre: form.nombre,
          titular_id: Number(form.titular_id),
        }),
      });
      setForm({ nombre: '', titular_id: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Familias</h2>
      <p className="mt-1 text-sm text-slate-600">
        Grupos familiares (un titular, varios socios).
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
          Titular
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.titular_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, titular_id: e.target.value }))
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
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          Crear familia
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
                <th className="px-4 py-3">Titular</th>
                <th className="px-4 py-3">Miembros</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{f.nombre}</td>
                  <td className="px-4 py-3">
                    {f.titular.apellido}, {f.titular.nombre}
                  </td>
                  <td className="px-4 py-3">{f.socios.length}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-slate-500">
                    Sin familias.
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
