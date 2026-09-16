'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { DataTable, FloatingActionButton, type Column } from '@/components/common';
import { formatDias } from '@/lib/dias-semana';

type Horario = {
  id: number;
  titulo: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  profe_id: number | null;
  espacio_id: number | null;
  espacio: { id: number; nombre: string } | null;
  activo: boolean;
};

type Actividad = {
  id: number;
  nombre: string;
  modo_cobro: string;
  monto_adicional: number;
  profe_id: number | null;
  activo: boolean;
};

type Tab = 'horarios' | 'actividades';

export function ActividadesHorariosContent({ initialTab }: { initialTab: Tab }) {
  const { t } = useTranslation();
  const { formatHmRange } = useDateTimeFormat();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [h, a] = await Promise.all([
        apiFetch<Horario[]>('/horarios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Actividad[]>('/actividades', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setHorarios(h);
      setActividades(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDeleteHorario(h: Horario) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/horarios/${h.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  async function onDeleteActividad(a: Actividad) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/actividades/${a.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  const horarioColumns: Column<Horario>[] = [
    { key: 'titulo', header: t('admin.horarios.titulo'), sortable: true },
    {
      key: 'dias',
      header: t('admin.horarios.dias'),
      render: (h) => formatDias(h.dias),
    },
    {
      key: 'espacio',
      header: t('admin.horarios.espacio'),
      accessor: (h) => h.espacio?.nombre ?? t('admin.horarios.sinEspacio'),
    },
    {
      key: 'horario',
      header: t('admin.espacios.horario'),
      accessor: (h) => formatHmRange(h.hora_inicio, h.hora_fin),
    },
    {
      key: 'activo',
      header: t('admin.espacios.activo'),
      render: (h) => (h.activo ? t('common.yes') : t('common.no')),
    },
  ];

  const actividadColumns: Column<Actividad>[] = [
    { key: 'nombre', header: t('admin.actividades.nombre'), sortable: true },
    { key: 'modo_cobro', header: t('admin.actividades.modoCobro') },
    {
      key: 'monto_adicional',
      header: t('admin.actividades.adicional'),
      align: 'right',
      render: (a) => `$${a.monto_adicional}`,
    },
    {
      key: 'activo',
      header: t('admin.espacios.activo'),
      render: (a) => (a.activo ? t('common.yes') : t('common.no')),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'horarios', label: t('admin.horarios.title') },
    { key: 'actividades', label: t('admin.actividades.title') },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">
        {tab === 'horarios' ? t('admin.horarios.title') : t('admin.actividades.title')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {tab === 'horarios' ? t('admin.horarios.subtitle') : t('admin.actividades.subtitle')}
      </p>

      <div className="mt-6 flex flex-wrap gap-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`-mb-px whitespace-nowrap rounded-t-lg border-x border-t px-4 py-2 text-sm font-semibold transition-colors ${
              tab === tb.key
                ? 'border-slate-200 border-b-white bg-white text-slate-900'
                : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="-mt-px">
        {tab === 'horarios' ? (
          <DataTable
            columns={horarioColumns}
            data={horarios}
            getRowId={(h) => h.id}
            loading={loading}
            onEdit={(h) => router.push(`/horarios/nuevo?id=${h.id}`)}
            onDelete={onDeleteHorario}
            deleteConfirmMessage={t('admin.horarios.confirmDelete')}
            className="rounded-t-none"
          />
        ) : (
          <DataTable
            columns={actividadColumns}
            data={actividades}
            getRowId={(a) => a.id}
            loading={loading}
            onEdit={(a) => router.push(`/actividades/nuevo?id=${a.id}`)}
            onDelete={onDeleteActividad}
            deleteConfirmMessage={t('admin.actividades.confirmDelete')}
            className="rounded-t-none"
          />
        )}
      </div>

      <FloatingActionButton
        onClick={() =>
          router.push(tab === 'horarios' ? '/horarios/nuevo' : '/actividades/nuevo')
        }
        aria-label={tab === 'horarios' ? t('admin.horarios.createHorario') : t('admin.actividades.createActividad')}
        title={tab === 'horarios' ? t('admin.horarios.createHorario') : t('admin.actividades.createActividad')}
      />
    </div>
  );
}
