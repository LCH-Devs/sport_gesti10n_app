'use client';

import { apiFetch, getSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

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
  const [data, setData] = useState<AlertaFuga | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = getSession();
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
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h2 className="text-2xl font-bold">Alerta de fuga</h2>
      <p className="mt-1 text-sm text-slate-600">
        Socios en riesgo por deuda o baja asistencia.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 rounded-xl border bg-white p-4">
        <p className="text-xs text-slate-500">Total alertas</p>
        <p className="text-2xl font-bold">{data?.total ?? '—'}</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">Cargando…</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Cuotas pend.</th>
                <th className="px-4 py-3">Asistencia</th>
                <th className="px-4 py-3">Motivo</th>
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
                    Sin alertas.
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
