'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

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

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('fuga.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t('fuga.subtitle')}</p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 rounded-xl border bg-white p-4">
        <p className="text-xs text-slate-500">{t('fuga.totalAlertas')}</p>
        <p className="text-2xl font-bold">{data?.total ?? '—'}</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('fuga.socio')}</th>
                <th className="px-4 py-3">{t('fuga.dni')}</th>
                <th className="px-4 py-3">{t('fuga.cuotasPend')}</th>
                <th className="px-4 py-3">{t('fuga.asistencia')}</th>
                <th className="px-4 py-3">{t('fuga.motivo')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(data?.socios || []).map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {s.apellido}, {s.nombre}
                  </td>
                  <td className="px-4 py-3 font-mono">{s.dni}</td>
                  <td className="px-4 py-3">{s.cuotas_pendientes}</td>
                  <td className="px-4 py-3">
                    {s.asistencia_pct == null
                      ? '—'
                      : `${s.asistencia_pct}%`}
                  </td>
                  <td className="px-4 py-3">{s.motivo}</td>
                  <td className="px-4 py-3 text-right">
                    {s.whatsapp_url ? (
                      <a
                        href={s.whatsapp_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-700 hover:underline"
                      >
                        WhatsApp
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {data && data.socios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-slate-500">
                    {t('fuga.sinAlertas')}
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
