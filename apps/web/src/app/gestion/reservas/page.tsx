'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { EspaciosReservasTabs } from '../_components/EspaciosReservasTabs';
import { DataTable, FloatingActionButton, Badge, type Column } from '@/components/common';
import { XCircleIcon } from '@heroicons/react/24/outline';

type Reserva = {
  id: number;
  inicio: string;
  fin: string;
  estado: string;
  nota: string | null;
  socio: { id: number; nombre: string; apellido: string; dni: string };
  espacio: { id: number; nombre: string };
};

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  confirmada: 'success',
  cancelada: 'error',
};

export default function ReservasPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Reserva[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const reservas = await apiFetch<Reserva[]>('/reservas', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setItems(reservas);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancelar(id: number) {
    const session = requireSession();
    if (!session || !confirm(t('admin.reservas.confirmCancelar'))) return;
    try {
      await apiFetch(`/reservas/${id}/cancelar`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCancelling'));
    }
  }

  const columns: Column<Reserva>[] = [
    { key: 'espacio', header: t('admin.reservas.espacio'), accessor: (r) => r.espacio.nombre },
    {
      key: 'socio',
      header: t('admin.reservas.socio'),
      accessor: (r) => `${r.socio.apellido}, ${r.socio.nombre}`,
    },
    {
      key: 'inicio',
      header: t('admin.reservas.inicio'),
      sortable: true,
      render: (r) => new Date(r.inicio).toLocaleString('es-AR'),
    },
    {
      key: 'fin',
      header: t('admin.reservas.fin'),
      render: (r) => new Date(r.fin).toLocaleString('es-AR'),
    },
    {
      key: 'estado',
      header: t('admin.reservas.estado'),
      render: (r) => (
        <Badge label={r.estado} variant={ESTADO_VARIANT[r.estado] || 'info'} />
      ),
    },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.reservas.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.reservas.subtitle')}
      </p>

      <div className="mt-6">
        <EspaciosReservasTabs />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="-mt-px">
        <DataTable
          columns={columns}
          data={items}
          getRowId={(r) => r.id}
          loading={loading}
          className="rounded-t-none"
          actions={(r) =>
            r.estado === 'confirmada' ? (
              <button
                type="button"
                onClick={() => void onCancelar(r.id)}
                className="text-slate-500 hover:text-red-600"
                aria-label={t('admin.reservas.cancelar')}
                title={t('admin.reservas.cancelar')}
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            ) : null
          }
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/reservas/nuevo')}
        aria-label={t('admin.reservas.createReserva')}
        title={t('admin.reservas.createReserva')}
      />
    </div>
  );
}
