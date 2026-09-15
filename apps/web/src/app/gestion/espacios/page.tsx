'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
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

export default function EspaciosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Espacio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
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
      accessor: (e) => `${e.hora_apertura} – ${e.hora_cierre}`,
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
