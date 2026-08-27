'use client';

import { apiFetch, getSession } from '@/lib/api';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type HoyData = {
  mes: string;
  cobranza: {
    total: number;
    pagados: number;
    pendientes: number;
    pct_cobrado: number;
  };
  deudores: Array<{
    id: number;
    dni: string;
    nombre: string;
    apellido: string;
    monto: number;
  }>;
  reservas_hoy: Array<{
    id: number;
    inicio: string;
    fin: string;
    socio: { id: number; nombre: string; apellido: string; dni: string };
    espacio: { id: number; nombre: string };
  }>;
  horarios_hoy: Array<{
    id: number;
    titulo: string;
    dias: string;
    hora_inicio: string;
    hora_fin: string;
  }>;
  alertas_fuga_count: number;
};

export default function AdminHomePage() {
  const [data, setData] = useState<HoyData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<HoyData>('/reportes/hoy', {
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
      <h2 className="text-2xl font-bold text-slate-900">Hoy en el club</h2>
      <p className="mt-1 text-sm text-slate-600">
        Resumen del día: cobranza, reservas, horarios y alertas.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-slate-500">Cargando…</p>}

      {data && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">Cobranza {data.mes}</p>
              <p className="text-2xl font-bold">
                {data.cobranza.pct_cobrado}%
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">Pagados</p>
              <p className="text-2xl font-bold text-green-700">
                {data.cobranza.pagados}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">Pendientes</p>
              <p className="text-2xl font-bold text-amber-700">
                {data.cobranza.pendientes}
              </p>
            </div>
            <Link
              href="/supercalifragilisticoespiralidoso/gestion/fuga"
              className="rounded-xl border bg-white p-4 hover:bg-slate-50"
            >
              <p className="text-xs text-slate-500">Alertas fuga</p>
              <p className="text-2xl font-bold text-red-700">
                {data.alertas_fuga_count}
              </p>
              <p className="mt-1 text-xs text-blue-600">Ver alerta de fuga →</p>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-xl border bg-white">
              <h3 className="border-b bg-slate-50 px-4 py-3 font-semibold">
                Deudores
              </h3>
              {data.deudores.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Sin deudores.</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Socio</th>
                      <th className="px-4 py-2">DNI</th>
                      <th className="px-4 py-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.deudores.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          {d.apellido}, {d.nombre}
                        </td>
                        <td className="px-4 py-2 font-mono">{d.dni}</td>
                        <td className="px-4 py-2">${d.monto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border bg-white">
              <h3 className="border-b bg-slate-50 px-4 py-3 font-semibold">
                Reservas hoy
              </h3>
              {data.reservas_hoy.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Sin reservas hoy.</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Espacio</th>
                      <th className="px-4 py-2">Socio</th>
                      <th className="px-4 py-2">Horario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reservas_hoy.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-4 py-2">{r.espacio.nombre}</td>
                        <td className="px-4 py-2">
                          {r.socio.apellido}, {r.socio.nombre}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(r.inicio).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          –{' '}
                          {new Date(r.fin).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
            <h3 className="border-b bg-slate-50 px-4 py-3 font-semibold">
              Horarios hoy
            </h3>
            {data.horarios_hoy.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Sin horarios hoy.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Título</th>
                    <th className="px-4 py-2">Días</th>
                    <th className="px-4 py-2">Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {data.horarios_hoy.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{h.titulo}</td>
                      <td className="px-4 py-2">{h.dias}</td>
                      <td className="px-4 py-2">
                        {h.hora_inicio} – {h.hora_fin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
