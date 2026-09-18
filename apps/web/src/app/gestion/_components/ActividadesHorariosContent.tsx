'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { interpolate, useTranslation } from '@/lib/useTranslation';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { DataTable, FloatingActionButton, type Column } from '@/components/common';
import { PencilIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  horarios: Horario[];
};

export function ActividadesHorariosContent() {
  const { t } = useTranslation();
  const { formatHmRange } = useDateTimeFormat();
  const router = useRouter();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const a = await apiFetch<Actividad[]>('/actividades', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
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
      key: 'horarios',
      header: t('admin.horarios.title'),
      accessor: (a) => a.horarios.length,
      render: (a) =>
        a.horarios.length > 0
          ? interpolate(t('admin.actividades.horariosCount'), { count: a.horarios.length })
          : t('admin.actividades.sinHorarios'),
    },
    {
      key: 'activo',
      header: t('admin.espacios.activo'),
      render: (a) => (a.activo ? t('common.yes') : t('common.no')),
    },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.actividades.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t('admin.actividades.subtitle')}</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={actividadColumns}
          data={actividades}
          getRowId={(a) => a.id}
          loading={loading}
          onEdit={(a) => router.push(`/actividades/nuevo?id=${a.id}`)}
          onDelete={onDeleteActividad}
          deleteConfirmMessage={t('admin.actividades.confirmDelete')}
          actions={(a) => (
            <button
              type="button"
              onClick={() => router.push(`/horarios/nuevo?actividad_id=${a.id}`)}
              className="text-slate-500 hover:text-blue-600"
              aria-label={t('admin.horarios.createHorario')}
              title={t('admin.horarios.createHorario')}
            >
              <PlusCircleIcon className="h-4 w-4" />
            </button>
          )}
          renderExpanded={(a) =>
            a.horarios.length === 0 ? (
              <p className="text-sm text-slate-500">{t('admin.actividades.sinHorarios')}</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('admin.horarios.titulo')}</th>
                      <th className="px-3 py-2 font-medium">{t('admin.horarios.dias')}</th>
                      <th className="px-3 py-2 font-medium">{t('admin.espacios.horario')}</th>
                      <th className="px-3 py-2 font-medium">{t('admin.horarios.espacio')}</th>
                      <th className="px-3 py-2 font-medium">{t('admin.espacios.activo')}</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {a.horarios.map((h) => (
                      <tr key={h.id} className="border-b last:border-0">
                        <td className="px-3 py-2">{h.titulo}</td>
                        <td className="px-3 py-2">{formatDias(h.dias)}</td>
                        <td className="px-3 py-2">{formatHmRange(h.hora_inicio, h.hora_fin)}</td>
                        <td className="px-3 py-2">
                          {h.espacio?.nombre ?? t('admin.horarios.sinEspacio')}
                        </td>
                        <td className="px-3 py-2">{h.activo ? t('common.yes') : t('common.no')}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => router.push(`/horarios/nuevo?id=${h.id}`)}
                              className="text-slate-500 hover:text-blue-600"
                              aria-label={t('dataTable.edit', 'Editar')}
                              title={t('dataTable.edit', 'Editar')}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteHorario(h)}
                              className="text-slate-500 hover:text-red-600"
                              aria-label={t('dataTable.delete', 'Eliminar')}
                              title={t('dataTable.delete', 'Eliminar')}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/actividades/nuevo')}
        aria-label={t('admin.actividades.createActividad')}
        title={t('admin.actividades.createActividad')}
      />
    </div>
  );
}
