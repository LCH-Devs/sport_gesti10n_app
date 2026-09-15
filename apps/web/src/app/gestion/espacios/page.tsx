'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { EspaciosReservasTabs } from '../_components/EspaciosReservasTabs';
import { DataTable, FloatingActionButton, type Column } from '@/components/common';

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

type Ocupacion = {
  espacio_id: number;
  dia: { pct: number };
  semana: { pct: number };
  mes: { pct: number };
  calor: { manana: number; tarde: number; noche: number };
};

function barColor(pct: number) {
  if (pct >= 70) return 'bg-red-500';
  if (pct >= 40) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function OccupancyBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="min-w-[4.5rem]">
      <div className="flex justify-between text-[10px] leading-none text-slate-500">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HeatDots({
  calor,
  labels,
}: {
  calor: Ocupacion['calor'];
  labels: { manana: string; tarde: string; noche: string };
}) {
  const cell = (v: number, title: string) => (
    <span
      title={`${title}: ${v}%`}
      className="inline-block h-4 w-4 rounded-sm border border-slate-200"
      style={{ backgroundColor: `rgba(185, 28, 28, ${Math.max(0.06, v / 100)})` }}
    />
  );
  return (
    <div className="flex items-center gap-0.5">
      {cell(calor.manana, labels.manana)}
      {cell(calor.tarde, labels.tarde)}
      {cell(calor.noche, labels.noche)}
    </div>
  );
}

export default function EspaciosPage() {
  const { t } = useTranslation();
  const { formatHmRange } = useDateTimeFormat();
  const router = useRouter();
  const [items, setItems] = useState<Espacio[]>([]);
  const [ocupacion, setOcupacion] = useState<Record<number, Ocupacion>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [data, occ] = await Promise.all([
        apiFetch<Espacio[]>('/espacios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Ocupacion[]>('/espacios/ocupacion', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setItems(data);
      setOcupacion(Object.fromEntries(occ.map((o) => [o.espacio_id, o])));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(espacio: Espacio) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/espacios/${espacio.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  const columns: Column<Espacio>[] = [
    { key: 'nombre', header: t('admin.espacios.nombre'), sortable: true },
    { key: 'tipo', header: t('admin.espacios.tipo') },
    {
      key: 'slot',
      header: t('admin.espacios.slot'),
      accessor: (e) => e.duracion_slot_min,
      render: (e) => `${e.duracion_slot_min} min`,
    },
    {
      key: 'horario',
      header: t('admin.espacios.horario'),
      accessor: (e) => formatHmRange(e.hora_apertura, e.hora_cierre),
    },
    {
      key: 'ocupacion',
      header: t('admin.espacios.ocupacion'),
      render: (e) => {
        const o = ocupacion[e.id];
        if (!o) return '—';
        return (
          <div className="flex flex-wrap items-end gap-3">
            <OccupancyBar label={t('admin.espacios.ocupacionDia')} pct={o.dia.pct} />
            <OccupancyBar label={t('admin.espacios.ocupacionSemana')} pct={o.semana.pct} />
            <OccupancyBar label={t('admin.espacios.ocupacionMes')} pct={o.mes.pct} />
          </div>
        );
      },
    },
    {
      key: 'calor',
      header: t('admin.espacios.calor'),
      render: (e) => {
        const o = ocupacion[e.id];
        if (!o) return '—';
        return (
          <HeatDots
            calor={o.calor}
            labels={{
              manana: t('admin.espacios.calorManana'),
              tarde: t('admin.espacios.calorTarde'),
              noche: t('admin.espacios.calorNoche'),
            }}
          />
        );
      },
    },
    {
      key: 'activo',
      header: t('admin.espacios.activo'),
      render: (e) => (e.activo ? t('common.yes') : t('common.no')),
    },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.espacios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.espacios.subtitle')}
      </p>

      <div className="mt-6">
        <EspaciosReservasTabs />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="-mt-px">
        <DataTable
          columns={columns}
          data={items}
          getRowId={(e) => e.id}
          loading={loading}
          onEdit={(e) => router.push(`/espacios/nuevo?id=${e.id}`)}
          onDelete={onDelete}
          deleteConfirmMessage={t('admin.espacios.confirmDelete', '¿Eliminar este espacio?')}
          className="rounded-t-none"
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/espacios/nuevo')}
        aria-label={t('admin.espacios.createEspacio')}
        title={t('admin.espacios.createEspacio')}
      />
    </div>
  );
}
