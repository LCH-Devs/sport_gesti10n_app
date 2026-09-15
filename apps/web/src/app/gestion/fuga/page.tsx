'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { DataTable, type Column } from '@/components/common';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

type Alerta = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  cuotas_pendientes: number;
  asistencia_pct: number | null;
  motivo: string;
  whatsapp_url: string | null;
};

type AlertaFuga = {
  socios: Alerta[];
  total: number;
};

export default function FugaPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<AlertaFuga | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<AlertaFuga>('/reportes/alerta-fuga', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Alerta>[] = [
    {
      key: 'socio',
      header: t('fuga.socio'),
      accessor: (s) => `${s.apellido}, ${s.nombre}`,
    },
    { key: 'dni', header: t('fuga.dni') },
    { key: 'cuotas_pendientes', header: t('fuga.cuotasPend'), align: 'right' },
    {
      key: 'asistencia',
      header: t('fuga.asistencia'),
      accessor: (s) => s.asistencia_pct,
      render: (s) => (s.asistencia_pct == null ? '—' : `${s.asistencia_pct}%`),
    },
    { key: 'motivo', header: t('fuga.motivo') },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('fuga.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t('fuga.subtitle')}</p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 rounded-xl border bg-white p-4">
        <p className="text-xs text-slate-500">{t('fuga.totalAlertas')}</p>
        <p className="text-2xl font-bold">{data?.total ?? '—'}</p>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={data?.socios || []}
          getRowId={(s) => s.id}
          loading={loading}
          emptyMessage={t('fuga.sinAlertas')}
          actions={(s) =>
            s.whatsapp_url ? (
              <a
                href={s.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-green-700"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
              </a>
            ) : null
          }
        />
      </div>
    </div>
  );
}
