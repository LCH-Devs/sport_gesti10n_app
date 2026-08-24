'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

type Torneo = {
  id: number;
  nombre: string;
  deporte: string;
  estado: string;
  _count?: { partidos: number };
};

type Partido = {
  id: number;
  rival_a: string;
  rival_b: string;
  fecha: string | null;
  goles_a: number | null;
  goles_b: number | null;
  jugado: boolean;
};

type TablaRow = {
  equipo: string;
  puntos: number;
  jugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  goles_favor: number;
  goles_contra: number;
};

export default function TorneosPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Torneo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [tabla, setTabla] = useState<TablaRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', deporte: '' });
  const [partidoForm, setPartidoForm] = useState({
    rival_a: '',
    rival_b: '',
    fecha: '',
  });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Torneo[]>('/torneos', {
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

  const loadDetalle = useCallback(async (id: number) => {
    const session = getSession();
    if (!session) return;
    try {
      const [ps, tb] = await Promise.all([
        apiFetch<Partido[]>(`/torneos/${id}/partidos`, {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<{ tabla: TablaRow[] }>(`/torneos/${id}/tabla`, {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setPartidos(ps);
      setTabla(tb.tabla || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedId != null) void loadDetalle(selectedId);
  }, [selectedId, loadDetalle]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch('/torneos', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(form),
      });
      setForm({ nombre: '', deporte: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  async function onCreatePartido(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session || selectedId == null) return;
    try {
      await apiFetch(`/torneos/${selectedId}/partidos`, {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          rival_a: partidoForm.rival_a,
          rival_b: partidoForm.rival_b,
          fecha: partidoForm.fecha
            ? new Date(partidoForm.fecha).toISOString()
            : undefined,
        }),
      });
      setPartidoForm({ rival_a: '', rival_b: '', fecha: '' });
      await loadDetalle(selectedId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear partido');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.torneos.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.torneos.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">{t('admin.torneos.nuevo')}</h3>
        <label className="text-sm">
          {t('admin.torneos.nombre')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.torneos.deporte')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.deporte}
            onChange={(e) =>
              setForm((f) => ({ ...f, deporte: e.target.value }))
            }
            required
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          {t('admin.torneos.crear')}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('admin.torneos.nombre')}</th>
                <th className="px-4 py-3">{t('admin.torneos.deporte')}</th>
                <th className="px-4 py-3">{t('dashboard.status')}</th>
                <th className="px-4 py-3">{t('admin.torneos.partidos')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr
                  key={t.id}
                  className={`cursor-pointer border-b last:border-0 hover:bg-slate-50 ${
                    selectedId === t.id ? 'bg-slate-50' : ''
                  }`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <td className="px-4 py-3 font-medium">{t.nombre}</td>
                  <td className="px-4 py-3">{t.deporte}</td>
                  <td className="px-4 py-3">{t.estado}</td>
                  <td className="px-4 py-3">{t._count?.partidos ?? 0}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-slate-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedId != null && (
        <div className="mt-8 space-y-4">
          <form
            onSubmit={onCreatePartido}
            className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3"
          >
            <h3 className="sm:col-span-3 font-semibold">{t('admin.torneos.agregarPartido')}</h3>
            <label className="text-sm">
              {t('admin.torneos.equipoA')}
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={partidoForm.rival_a}
                onChange={(e) =>
                  setPartidoForm((f) => ({ ...f, rival_a: e.target.value }))
                }
                required
              />
            </label>
            <label className="text-sm">
              {t('admin.torneos.equipoB')}
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={partidoForm.rival_b}
                onChange={(e) =>
                  setPartidoForm((f) => ({ ...f, rival_b: e.target.value }))
                }
                required
              />
            </label>
            <label className="text-sm">
              {t('admin.torneos.fecha')}
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={partidoForm.fecha}
                onChange={(e) =>
                  setPartidoForm((f) => ({ ...f, fecha: e.target.value }))
                }
              />
            </label>
            <button
              type="submit"
              className="sm:col-span-3 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
            >
              {t('admin.torneos.crearPartido')}
            </button>
          </form>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <h3 className="border-b bg-slate-50 px-4 py-3 font-semibold">
              {t('admin.torneos.partidos')}
            </h3>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-slate-600">
                <tr>
                  <th className="px-4 py-2">{t('admin.torneos.equipoA')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.equipoB')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.resultado')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.fecha')}</th>
                </tr>
              </thead>
              <tbody>
                {partidos.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{p.rival_a}</td>
                    <td className="px-4 py-2">{p.rival_b}</td>
                    <td className="px-4 py-2">
                      {p.jugado
                        ? `${p.goles_a ?? 0} – ${p.goles_b ?? 0}`
                        : t('admin.torneos.pendiente')}
                    </td>
                    <td className="px-4 py-2">
                      {p.fecha
                        ? new Date(p.fecha).toLocaleString('es-AR')
                        : '—'}
                    </td>
                  </tr>
                ))}
                {partidos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-slate-500">
                      {t('messages.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <h3 className="border-b bg-slate-50 px-4 py-3 font-semibold">
              {t('admin.torneos.tabla')}
            </h3>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-slate-600">
                <tr>
                  <th className="px-4 py-2">{t('admin.torneos.equipo')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.pts')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.pj')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.pg')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.pe')}</th>
                  <th className="px-4 py-2">{t('admin.torneos.pp')}</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((r) => (
                  <tr key={r.equipo} className="border-b last:border-0">
                    <td className="px-4 py-2">{r.equipo}</td>
                    <td className="px-4 py-2 font-semibold">{r.puntos}</td>
                    <td className="px-4 py-2">{r.jugados}</td>
                    <td className="px-4 py-2">{r.ganados}</td>
                    <td className="px-4 py-2">{r.empatados}</td>
                    <td className="px-4 py-2">{r.perdidos}</td>
                  </tr>
                ))}
                {tabla.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-slate-500">
                      {t('admin.torneos.sinPartidosJugados')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
