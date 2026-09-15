'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  clearSocioSession,
  getSocioSession,
  requireSocioSession,
  type SocioSession,
} from '@/lib/api';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { formatDias } from '@/lib/dias-semana';
import { PortalRoleTabs } from '@/components/PortalRoleTabs';

type ProfePortal = {
  profe: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    es_socio: boolean;
  };
  club: { id: number; nombre: string };
  horarios: Array<{
    id: number;
    titulo: string;
    dias: string;
    hora_inicio: string;
    hora_fin: string;
    activo: boolean;
    espacio: { id: number; nombre: string } | null;
  }>;
  liquidaciones: Array<{
    id: number;
    mes: string;
    total_club: number;
    estado: string;
    fecha_pago: string | null;
  }>;
};

export default function ProfePage() {
  const router = useRouter();
  const { formatDateTime, formatHmRange } = useDateTimeFormat();
  const [session, setSession] = useState<SocioSession | null>(null);
  const [portal, setPortal] = useState<ProfePortal | null>(null);
  const [error, setError] = useState('');

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
    if (current.role !== 'profe') {
      router.replace('/socio');
      return;
    }
    setSession(current);
    void apiFetch<ProfePortal>('/profe/me', {
      token: current.access_token,
      clubSlug: current.club.slug,
    })
      .then(setPortal)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar el panel'),
      );
  }, [router]);

  if (!session) {
    return <main className="p-6">Cargando tu cuenta…</main>;
  }

  function handleLogout() {
    clearSocioSession();
    router.replace('/login');
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{session.club.nombre}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cerrar sesión
        </button>
      </header>

      <PortalRoleTabs session={session} />

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">{session.club.nombre}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Panel de profesor</h1>
        {portal?.profe && (
          <p className="mt-2 text-sm text-slate-600">
            {portal.profe.nombre} {portal.profe.apellido}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Mis horarios</h2>
        {!portal ? (
          <p className="mt-2 text-sm text-slate-500">Cargando horarios…</p>
        ) : portal.horarios.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No tenés horarios asignados.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {portal.horarios.map((horario) => (
              <li key={horario.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{horario.titulo}</span>
                  <span className={horario.activo ? 'text-emerald-700' : 'text-slate-500'}>
                    {horario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">
                  {formatDias(horario.dias)} ·{' '}
                  {formatHmRange(horario.hora_inicio, horario.hora_fin)}
                </p>
                {horario.espacio && (
                  <p className="mt-0.5 text-xs text-slate-500">{horario.espacio.nombre}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Mis liquidaciones</h2>
        {!portal ? (
          <p className="mt-2 text-sm text-slate-500">Cargando liquidaciones…</p>
        ) : portal.liquidaciones.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Todavía no hay liquidaciones.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {portal.liquidaciones.map((liquidacion) => (
              <li
                key={liquidacion.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{liquidacion.mes}</p>
                  {liquidacion.fecha_pago && (
                    <p className="text-xs text-slate-500">
                      Pagada el {formatDateTime(liquidacion.fecha_pago)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${liquidacion.total_club.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs capitalize text-slate-500">{liquidacion.estado}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
