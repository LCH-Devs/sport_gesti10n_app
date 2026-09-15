'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { DataTable, Badge, type Column } from '@/components/common';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

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
  const { formatDateTime } = useDateTimeFormat();
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
    const session = requireSession();
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
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadDetalle = useCallback(async (id: number) => {
    const session = requireSession();
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
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedId != null) void loadDetalle(selectedId);
  }, [selectedId, loadDetalle]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
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
      setError(err instanceof Error ? err.message : t('messages.errorCreating'));
    }
  }

  async function onDeleteTorneo(torneo: Torneo) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/torneos/${torneo.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      if (selectedId === torneo.id) setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  async function onCreatePartido(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
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
      setError(err instanceof Error ? err.message : t('messages.errorCreating'));
    }
  }

  async function onCargarResultado(partido: Partido) {
    const session = requireSession();
    if (!session || selectedId == null) return;
    const golesAStr = window.prompt(
      `${t('admin.torneos.equipoA')}: ${partido.rival_a}`,
      String(partido.goles_a ?? 0),
    );
    if (golesAStr == null) return;
    const golesBStr = window.prompt(
      `${t('admin.torneos.equipoB')}: ${partido.rival_b}`,
      String(partido.goles_b ?? 0),
    );
    if (golesBStr == null) return;
    const goles_a = Number(golesAStr);
    const goles_b = Number(golesBStr);
    if (!Number.isInteger(goles_a) || !Number.isInteger(goles_b) || goles_a < 0 || goles_b < 0) {
      setError(t('admin.torneos.resultadoInvalido', 'Ingresá números válidos'));
      return;
    }
    try {
      await apiFetch(`/partidos/${partido.id}/resultado`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({ goles_a, goles_b, jugado: true }),
      });
      await loadDetalle(selectedId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    }
  }

  const torneoColumns: Column<Torneo>[] = [
    { key: 'nombre', header: t('admin.torneos.nombre'), sortable: true },
    { key: 'deporte', header: t('admin.torneos.deporte') },
    { key: 'estado', header: t('dashboard.status') },
    {
      key: 'partidos',
      header: t('admin.torneos.partidos'),
      accessor: (row) => row._count?.partidos ?? 0,
    },
  ];

  const partidoColumns: Column<Partido>[] = [
    { key: 'rival_a', header: t('admin.torneos.equipoA') },
    { key: 'rival_b', header: t('admin.torneos.equipoB') },
    {
      key: 'resultado',
      header: t('admin.torneos.resultado'),
      render: (p) =>
        p.jugado ? (
          <Badge label={`${p.goles_a ?? 0} – ${p.goles_b ?? 0}`} variant="success" />
        ) : (
          <Badge label={t('admin.torneos.pendiente')} variant="pending" />
        ),
    },
    {
      key: 'fecha',
      header: t('admin.torneos.fecha'),
      render: (p) => (p.fecha ? formatDateTime(p.fecha) : '—'),
    },
  ];

  const tablaColumns: Column<TablaRow>[] = [
    { key: 'equipo', header: t('admin.torneos.equipo') },
    { key: 'puntos', header: t('admin.torneos.pts'), sortable: true },
    { key: 'jugados', header: t('admin.torneos.pj') },
    { key: 'ganados', header: t('admin.torneos.pg') },
    { key: 'empatados', header: t('admin.torneos.pe') },
    { key: 'perdidos', header: t('admin.torneos.pp') },
  ];

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
          className="sm:col-span-2 rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
        >
          {t('admin.torneos.crear')}
        </button>
      </form>

      <div className="mt-8">
        <DataTable
          columns={torneoColumns}
          data={items}
          getRowId={(row) => row.id}
          loading={loading}
          onDelete={onDeleteTorneo}
          deleteConfirmMessage={t('admin.torneos.confirmDelete', '¿Eliminar este torneo?')}
          rowClassName={(row) => (selectedId === row.id ? 'bg-slate-50' : '')}
          actions={(row) => (
            <button
              type="button"
              onClick={() => setSelectedId(row.id)}
              className="text-slate-500 hover:text-blue-600"
              aria-label={t('admin.torneos.verDetalle', 'Ver detalle')}
              title={t('admin.torneos.verDetalle', 'Ver detalle')}
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          )}
        />
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
              className="sm:col-span-3 rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
            >
              {t('admin.torneos.crearPartido')}
            </button>
          </form>

          <div>
            <h3 className="mb-2 font-semibold">{t('admin.torneos.partidos')}</h3>
            <DataTable
              columns={partidoColumns}
              data={partidos}
              getRowId={(row) => row.id}
              actions={(row) => (
                <button
                  type="button"
                  onClick={() => void onCargarResultado(row)}
                  className="text-slate-500 hover:text-blue-600"
                  aria-label={t('admin.torneos.cargarResultado', 'Cargar resultado')}
                  title={t('admin.torneos.cargarResultado', 'Cargar resultado')}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              )}
            />
          </div>

          <div>
            <h3 className="mb-2 font-semibold">{t('admin.torneos.tabla')}</h3>
            <DataTable
              columns={tablaColumns}
              data={tabla}
              getRowId={(row) => row.equipo}
              emptyMessage={t('admin.torneos.sinPartidosJugados')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
