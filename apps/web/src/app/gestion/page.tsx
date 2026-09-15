'use client';

import { apiFetch, requireSession } from '@/lib/api';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { interpolate, useTranslation } from '@/lib/useTranslation';
import { DataTable, type Column } from '@/components/common';

type PlanUso = {
  socios_activos: number;
  plan: string;
  plan_hasta: number;
  precio_usd_mes: number;
  pct: number;
  alerta: 'ok' | 'alto' | 'lleno' | 'pendiente';
  siguiente: {
    nombre: string;
    precio_usd: number;
    faltan: number;
  } | null;
  pendiente: {
    precio: number;
    confirmado: boolean;
    aplica_desde: string | null;
  } | null;
};

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

type Deudor = HoyData['deudores'][number];
type ReservaHoy = HoyData['reservas_hoy'][number];
type HorarioHoy = HoyData['horarios_hoy'][number];

export default function AdminHomePage() {
  const { t } = useTranslation();
  const [data, setData] = useState<HoyData | null>(null);
  const [plan, setPlan] = useState<PlanUso | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [res, planUso] = await Promise.all([
        apiFetch<HoyData>('/reportes/hoy', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<PlanUso>('/clubs/me/plan', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setData(res);
      setPlan(planUso);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const deudoresColumns: Column<Deudor>[] = [
    { key: 'socio', header: t('hoy.socio'), accessor: (d) => `${d.apellido}, ${d.nombre}` },
    { key: 'dni', header: t('hoy.dni') },
    { key: 'monto', header: t('hoy.monto'), align: 'right', render: (d) => `$${d.monto}` },
  ];

  const reservasColumns: Column<ReservaHoy>[] = [
    { key: 'espacio', header: t('hoy.espacio'), accessor: (r) => r.espacio.nombre },
    { key: 'socio', header: t('hoy.socio'), accessor: (r) => `${r.socio.apellido}, ${r.socio.nombre}` },
    {
      key: 'horario',
      header: t('hoy.horario'),
      render: (r) =>
        `${new Date(r.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} – ${new Date(
          r.fin,
        ).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
    },
  ];

  const horariosColumns: Column<HorarioHoy>[] = [
    { key: 'titulo', header: t('hoy.titulo') },
    { key: 'dias', header: t('hoy.dias') },
    { key: 'horario', header: t('hoy.horario'), accessor: (h) => `${h.hora_inicio} – ${h.hora_fin}` },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{t('hoy.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t('hoy.subtitle')}</p>

      {plan && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            plan.alerta === 'pendiente' || plan.alerta === 'lleno'
              ? 'border-red-200 bg-red-50'
              : plan.alerta === 'alto'
                ? 'border-amber-200 bg-amber-50'
                : 'border-slate-200 bg-white'
          }`}
        >
          <p className="text-sm font-semibold text-slate-900">
            {t('hoy.plan')}: {plan.plan} · USD {plan.precio_usd_mes}
            {t('hoy.perMonth')}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {plan.socios_activos} / {plan.plan_hasta} {t('hoy.sociosWord')}
          </p>
          {plan.siguiente && plan.siguiente.faltan > 0 && (
            <p className="mt-1 text-xs text-slate-600">
              {interpolate(t('hoy.upgradeNota'), {
                faltan: plan.siguiente.faltan,
                nombre: plan.siguiente.nombre,
                precio: plan.siguiente.precio_usd,
              })}
            </p>
          )}
          {plan.pendiente && !plan.pendiente.confirmado && (
            <div className="mt-3">
              <p className="text-xs text-red-700">{t('hoy.upgradePendiente')}</p>
              <button
                type="button"
                className="mt-2 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={() => {
                  const session = requireSession();
                  if (!session) return;
                  void apiFetch('/clubs/me/plan/confirmar', {
                    method: 'POST',
                    token: session.access_token,
                    clubSlug: session.club.slug,
                  }).then((uso) => setPlan(uso as PlanUso));
                }}
              >
                {t('hoy.confirmarUpgrade')}
              </button>
            </div>
          )}
          {plan.pendiente?.confirmado && (
            <p className="mt-1 text-xs text-slate-600">
              {interpolate(t('hoy.upgradeConfirmado'), {
                fecha: plan.pendiente.aplica_desde?.slice(0, 10) || '',
              })}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-slate-500">{t('common.loading')}</p>}

      {data && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">
                {interpolate(t('hoy.cobranzaMes'), { mes: data.mes })}
              </p>
              <p className="text-2xl font-bold">
                {data.cobranza.pct_cobrado}%
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">{t('hoy.pagados')}</p>
              <p className="text-2xl font-bold text-green-700">
                {data.cobranza.pagados}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">{t('hoy.pendientes')}</p>
              <p className="text-2xl font-bold text-amber-700">
                {data.cobranza.pendientes}
              </p>
            </div>
            <Link
              href="/gestion/fuga"
              className="rounded-xl border bg-white p-4 hover:bg-slate-50"
            >
              <p className="text-xs text-slate-500">{t('hoy.alertasFuga')}</p>
              <p className="text-2xl font-bold text-red-700">
                {data.alertas_fuga_count}
              </p>
              <p className="mt-1 text-xs text-blue-600">{t('hoy.verAlertaFuga')}</p>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">{t('hoy.deudores')}</h3>
              <DataTable
                columns={deudoresColumns}
                data={data.deudores}
                getRowId={(d) => d.id}
                emptyMessage={t('hoy.sinDeudores')}
              />
            </div>

            <div>
              <h3 className="mb-2 font-semibold">{t('hoy.reservasHoy')}</h3>
              <DataTable
                columns={reservasColumns}
                data={data.reservas_hoy}
                getRowId={(r) => r.id}
                emptyMessage={t('hoy.sinReservasHoy')}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 font-semibold">{t('hoy.horariosHoy')}</h3>
            <DataTable
              columns={horariosColumns}
              data={data.horarios_hoy}
              getRowId={(h) => h.id}
              emptyMessage={t('hoy.sinHorariosHoy')}
            />
          </div>
        </>
      )}
    </div>
  );
}
