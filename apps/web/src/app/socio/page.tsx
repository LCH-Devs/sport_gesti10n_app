'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearSocioSession, getSocioSession, requireSocioSession, type SocioSession } from '@/lib/api';
import { interpolate, useTranslation } from '@/lib/useTranslation';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { PortalRoleTabs } from '@/components/PortalRoleTabs';

type Profile = SocioSession['socio'] & { telefono?: string; fecha_nacimiento?: string | null };

type Pago = {
  id: number;
  mes: string;
  monto: number;
  estado: string;
  fecha_pago: string | null;
  tipo: string;
  concepto: string | null;
};

type PortalMe = {
  socio: Profile;
  club: { id: number; nombre: string };
  pagos: Pago[];
};

type Espacio = {
  id: number;
  nombre: string;
  tipo: string;
  duracion_slot_min: number;
  hora_apertura: string;
  hora_cierre: string;
};

function todayYmd(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type Reserva = {
  id: number;
  espacio_id: number;
  espacio: { id: number; nombre: string; tipo: string };
  inicio: string;
  fin: string;
  estado: string;
  nota: string | null;
};

type Slot = { inicio: string; fin: string; libre: boolean };

const ESTADO_LABEL_KEY: Record<string, string> = {
  pendiente: 'estadoPendiente',
  pagado: 'estadoPagado',
  cancelado: 'estadoCancelado',
  rechazado: 'estadoRechazado',
  reembolsado: 'estadoReembolsado',
};

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  pagado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-slate-100 text-slate-600',
  rechazado: 'bg-red-100 text-red-700',
  reembolsado: 'bg-slate-100 text-slate-600',
};

function formatMes(mes: string) {
  const d = new Date(mes);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
}

export default function SocioPage() {
  const { t } = useTranslation();
  const { formatDateTime, formatTime } = useDateTimeFormat();
  const [session, setSession] = useState<SocioSession | null>(null);
  const [portal, setPortal] = useState<PortalMe | null>(null);
  const [error, setError] = useState('');

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservasError, setReservasError] = useState('');
  const [loadingReservas, setLoadingReservas] = useState(true);

  const [espacioId, setEspacioId] = useState<string>('');
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [creando, setCreando] = useState(false);

  const loadReservas = useCallback(async (current: SocioSession) => {
    setLoadingReservas(true);
    setReservasError('');
    try {
      const [espaciosData, reservasData] = await Promise.all([
        apiFetch<Espacio[]>('/socio/espacios', {
          token: current.access_token,
          clubSlug: current.club.slug,
        }),
        apiFetch<Reserva[]>('/socio/reservas', {
          token: current.access_token,
          clubSlug: current.club.slug,
        }),
      ]);
      setEspacios(espaciosData);
      setReservas(reservasData);
      if (!espacioId && espaciosData.length) setEspacioId(String(espaciosData[0].id));
    } catch (err) {
      setReservasError(
        err instanceof Error ? err.message : t('socioPortal.errorReservas'),
      );
    } finally {
      setLoadingReservas(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const router = useRouter();

  useEffect(() => {
    const current = getSocioSession();
    if (!current) {
      requireSocioSession();
      return;
    }
    if (current.must_change_password) {
      router.replace('/socio/cambiar-clave');
      return;
    }
    if (!current.es_socio) {
      router.replace('/profe');
      return;
    }
    setSession(current);
    void apiFetch<PortalMe>('/socio/me', {
      token: current.access_token,
      clubSlug: current.club.slug,
    })
      .then(setPortal)
      .catch((err) => setError(err instanceof Error ? err.message : t('socioPortal.errorPerfil')));
    void loadReservas(current);
  }, [loadReservas]);

  async function onBuscarDisponibilidad() {
    if (!session || !espacioId || !fecha) return;
    setLoadingSlots(true);
    setReservasError('');
    setSlots([]);
    try {
      const data = await apiFetch<{ slots: Slot[] }>(
        `/socio/espacios/${espacioId}/disponibilidad?fecha=${fecha}`,
        { token: session.access_token, clubSlug: session.club.slug },
      );
      setSlots(data.slots);
    } catch (err) {
      setReservasError(err instanceof Error ? err.message : t('socioPortal.errorBuscarHorarios'));
    } finally {
      setLoadingSlots(false);
    }
  }

  async function onReservar(slot: Slot) {
    if (!session || !espacioId) return;
    setCreando(true);
    setReservasError('');
    try {
      await apiFetch('/socio/reservas', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          espacio_id: Number(espacioId),
          inicio: slot.inicio,
          fin: slot.fin,
        }),
      });
      setSlots([]);
      await loadReservas(session);
    } catch (err) {
      setReservasError(err instanceof Error ? err.message : t('socioPortal.errorReservar'));
    } finally {
      setCreando(false);
    }
  }

  async function onCancelar(reserva: Reserva) {
    if (!session) return;
    if (!confirm(interpolate(t('socioPortal.confirmCancelar'), { nombre: reserva.espacio.nombre }))) return;
    setReservasError('');
    try {
      await apiFetch(`/socio/reservas/${reserva.id}/cancelar`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await loadReservas(session);
    } catch (err) {
      setReservasError(err instanceof Error ? err.message : t('socioPortal.errorCancelar'));
    }
  }

  if (!session) return <main className="p-6">{t('socioPortal.cargandoCuenta')}</main>;

  const profile = portal?.socio;
  const isPendiente = profile?.estado === 'pendiente';
  const pagos = portal?.pagos ?? [];
  const ahora = Date.now();
  const reservasFuturas = reservas.filter(
    (r) => r.estado === 'confirmada' && new Date(r.inicio).getTime() > ahora,
  );
  const reservasPasadas = reservas.filter((r) => !reservasFuturas.includes(r));

  function handleLogout() {
    clearSocioSession();
    router.replace('/login');
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {session.club.nombre}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          {t('socioPortal.cerrarSesion')}
        </button>
      </header>

      <PortalRoleTabs session={session} />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">{session.club.nombre}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{t('socioPortal.miCuenta')}</h1>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {isPendiente && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {t('socioPortal.cuentaPendienteAviso')}
          </p>
        )}
        {profile && (
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><dt className="text-xs uppercase text-slate-500">{t('socioPortal.nombre')}</dt><dd className="font-medium">{profile.nombre} {profile.apellido}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">{t('socioPortal.dni')}</dt><dd className="font-medium">{profile.dni}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">{t('socioPortal.email')}</dt><dd className="font-medium">{profile.email}</dd></div>
            <div>
              <dt className="text-xs uppercase text-slate-500">{t('socioPortal.estado')}</dt>
              <dd className="font-medium">
                {isPendiente ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    {t('socioPortal.cuentaEstadoPendienteLabel')}
                  </span>
                ) : (
                  profile.estado
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <section className="mt-4 rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">{t('socioPortal.misCuotas')}</h2>
        {pagos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">{t('socioPortal.sinCuotas')}</p>
        ) : (
          <ul className="mt-3 divide-y">
            {pagos.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium capitalize">{formatMes(p.mes)}</p>
                  <p className="text-xs text-slate-500">
                    {p.concepto || (p.tipo === 'inscripcion' ? t('socioPortal.inscripcion') : t('socioPortal.cuota'))}
                    {p.fecha_pago ? ` · ${t('socioPortal.pagadaEl')} ${formatDateTime(p.fecha_pago)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">${p.monto.toLocaleString('es-AR')}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[p.estado] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {ESTADO_LABEL_KEY[p.estado] ? t(`socioPortal.${ESTADO_LABEL_KEY[p.estado]}`) : p.estado}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">{t('socioPortal.misReservas')}</h2>

        {reservasError && (
          <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{reservasError}</p>
        )}

        {espacios.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">{t('socioPortal.reservarHorario')}</p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-xs text-slate-600">
                {t('socioPortal.espacio')}
                <select
                  className="mt-1 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  value={espacioId}
                  onChange={(e) => {
                    setEspacioId(e.target.value);
                    setSlots([]);
                  }}
                >
                  {espacios.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-600">
                {t('socioPortal.fecha')}
                <input
                  type="date"
                  className="mt-1 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  value={fecha}
                  min={todayYmd()}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setSlots([]);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => void onBuscarDisponibilidad()}
                disabled={!espacioId || !fecha || loadingSlots || isPendiente}
                className="rounded-lg bg-[var(--primary,#003ec7)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loadingSlots ? t('socioPortal.buscando') : t('socioPortal.verHorariosLibres')}
              </button>
            </div>

            {slots.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.inicio}
                    type="button"
                    disabled={creando || isPendiente}
                    onClick={() => void onReservar(s)}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {formatTime(s.inicio)}
                  </button>
                ))}
              </div>
            )}
            {!loadingSlots && fecha && slots.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {t('socioPortal.elegirFechaHint')}
              </p>
            )}
          </div>
        )}

        {loadingReservas ? (
          <p className="mt-3 text-sm text-slate-500">{t('socioPortal.cargandoReservas')}</p>
        ) : reservas.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">{t('socioPortal.sinReservas')}</p>
        ) : (
          <>
            {reservasFuturas.length > 0 && (
              <ul className="mt-3 divide-y">
                {reservasFuturas.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{r.espacio.nombre}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(r.inicio)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onCancelar(r)}
                      disabled={isPendiente}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {t('socioPortal.cancelar')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {reservasPasadas.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-slate-500">
                  {interpolate(t('socioPortal.verHistorial'), { count: reservasPasadas.length })}
                </summary>
                <ul className="mt-2 divide-y">
                  {reservasPasadas.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2 text-sm text-slate-500">
                      <span>{r.espacio.nombre} · {formatDateTime(r.inicio)}</span>
                      <span className="text-xs capitalize">{r.estado}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>
    </main>
  );
}
