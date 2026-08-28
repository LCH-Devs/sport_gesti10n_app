'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

type PagoRow = {
  id: number;
  mes: string;
  monto: number;
  estado: string;
  mp_init_point: string | null;
  socio: {
    id: number;
    dni: string;
    nombre: string;
    apellido: string;
    email: string;
  };
};

type Resumen = {
  mes: string;
  total: number;
  cantidad_pagados: number;
  cantidad_pendientes: number;
  monto_pagado: number;
  monto_pendiente: number;
  pagos: PagoRow[];
};

function mesDefault() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CobrosPage() {
  const { t } = useTranslation();
  const [mes, setMes] = useState(mesDefault());
  const [monto, setMonto] = useState('');
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    try {
      const data = await apiFetch<Resumen>(
        `/pagos/resumen?mes=${encodeURIComponent(mes)}`,
        { token: session.access_token, clubSlug: session.club.slug },
      );
      setResumen(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }, [mes]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onGenerar(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setMsg('');
    try {
      const body: { mes: string; monto?: number } = { mes };
      if (monto) body.monto = Number(monto);
      const data = await apiFetch<{
        socios_procesados: number;
        message: string;
      }>('/pagos/cobrar-mes', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(body),
      });
      setMsg(
        `${data.message} Socios procesados: ${data.socios_procesados}.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar');
    } finally {
      setLoading(false);
    }
  }

  async function marcarPagado(id: number) {
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch(`/pagos/${id}/marcar-manual`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.cobros.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.cobros.subtitle')}
      </p>

      <form
        onSubmit={onGenerar}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
      >
        <label className="text-sm">
          {t('admin.cobros.mes')}
          <input
            className="mt-1 block rounded-lg border px-3 py-2"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            pattern="\d{4}-\d{2}"
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.cobros.monto')}
          <input
            type="number"
            min={1}
            className="mt-1 block rounded-lg border px-3 py-2"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={t('admin.cobros.cuotaPlaceholder')}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? t('admin.cobros.generando') : t('admin.cobros.generarYEnviar')}
        </button>
        <button
          type="button"
          className="rounded-lg border px-4 py-2"
          onClick={() => void load()}
        >
          {t('common.refresh')}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {resumen && (
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{t('admin.cobros.mes')}</p>
            <p className="text-lg font-bold">{resumen.mes}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{t('admin.cobros.pagados')}</p>
            <p className="text-lg font-bold text-green-700">
              {resumen.cantidad_pagados}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{t('admin.cobros.pendientes')}</p>
            <p className="text-lg font-bold text-amber-700">
              {resumen.cantidad_pendientes}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{t('admin.cobros.deuda')}</p>
            <p className="text-lg font-bold">{resumen.monto_pendiente}</p>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">{t('dashboard.member')}</th>
              <th className="px-4 py-3">{t('dashboard.dni')}</th>
              <th className="px-4 py-3">{t('admin.cobros.monto')}</th>
              <th className="px-4 py-3">{t('dashboard.status')}</th>
              <th className="px-4 py-3">{t('admin.cobros.link')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(resumen?.pagos || []).map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  {p.socio.apellido}, {p.socio.nombre}
                </td>
                <td className="px-4 py-3 font-mono">{p.socio.dni}</td>
                <td className="px-4 py-3">${p.monto}</td>
                <td className="px-4 py-3">{p.estado}</td>
                <td className="px-4 py-3">
                  {p.mp_init_point ? (
                    <a
                      href={p.mp_init_point}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t('admin.cobros.abrir')}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.estado !== 'pagado' && (
                    <button
                      type="button"
                      className="text-green-700 hover:underline"
                      onClick={() => void marcarPagado(p.id)}
                    >
                      {t('admin.cobros.marcarPagado')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resumen && resumen.pagos.length === 0 && (
          <p className="p-4 text-slate-500">
            {t('admin.cobros.sinPagos')}
          </p>
        )}
      </div>
    </div>
  );
}
