'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  applyClubTheme,
  clearSocioSession,
  getSocioSession,
  mediaUrl,
  SocioSession,
} from '@/lib/api';
import ClubAccountSwitcher from '@/components/ClubAccountSwitcher';
import { useTranslation } from '@/lib/useTranslation';

type PortalMe = {
  socio: {
    id: number;
    dni: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    estado: string;
    rol: string;
  };
  club: {
    id: number;
    slug: string;
    nombre: string;
    logo_url: string | null;
    color_primario: string;
    color_secundario: string | null;
    color_terciario: string | null;
    cuota_monto: number;
  } | null;
  pagos: Array<{
    id: number;
    mes: string;
    monto: number;
    estado: string;
    mp_init_point: string | null;
    fecha_pago: string | null;
  }>;
  noticias: Array<{
    id: number;
    titulo: string;
    cuerpo: string;
    fecha: string;
    es_evento: boolean;
  }>;
  actividades: Array<{ id: number; nombre: string }>;
};

function estadoLabel(
  estado: string,
  t: (key: string) => string,
) {
  if (estado === 'moroso') return t('socio.late');
  if (estado === 'suspendido') return t('socio.suspended');
  return t('socio.active');
}

export default function SocioHomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [session, setSession] = useState<SocioSession | null>(null);
  const [data, setData] = useState<PortalMe | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSocioSession();
    if (!s) {
      router.replace('/entrar');
      return;
    }
    applyClubTheme(s.club);
    setSession(s);
    apiFetch<PortalMe>('/socio/me', {
      token: s.access_token,
      clubSlug: s.club.slug,
    })
      .then((me) => {
        setData(me);
        if (me.club) applyClubTheme(me.club);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('common.error'));
      });
  }, [router, t]);

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        {t('common.loading')}
      </main>
    );
  }

  const club = data?.club || session.club;
  const socio = data?.socio || session.socio;

  return (
    <main className="min-h-screen bg-slate-50">
      <header
        className="border-b border-slate-200 bg-white"
        style={{ borderTop: `4px solid ${club.color_primario}` }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {club.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(club.logo_url)}
                alt=""
                className="h-10 w-10 object-contain"
              />
            ) : null}
            <div>
              <p className="text-sm text-slate-500">{t('socio.home')}</p>
              <h1 className="text-lg font-bold text-slate-900">{club.nombre}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ClubAccountSwitcher
              token={session.access_token}
              cuentas={session.cuentas}
              currentMembresiaId={session.socio.id}
            />
            <button
            type="button"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
            onClick={() => {
              clearSocioSession();
              router.replace('/entrar');
            }}
          >
            {t('common.logout')}
          </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            {socio.nombre} {socio.apellido}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{socio.email}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">{t('socio.dni')}</dt>
              <dd className="font-medium text-slate-900">{socio.dni}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('socio.status')}</dt>
              <dd className="font-medium text-slate-900">
                {estadoLabel(socio.estado, t)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('socio.payments')}
          </h2>
          {!data ? (
            <p className="mt-3 text-sm text-slate-500">{t('common.loading')}</p>
          ) : data.pagos.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t('socio.noPayments')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.pagos.map((pago) => (
                <li
                  key={pago.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{pago.mes}</p>
                    <p className="text-slate-500">
                      ${pago.monto.toLocaleString('es-AR')} ·{' '}
                      {pago.estado === 'pagado'
                        ? t('socio.paid')
                        : t('socio.pending')}
                    </p>
                  </div>
                  {pago.estado !== 'pagado' && pago.mp_init_point ? (
                    <a
                      href={pago.mp_init_point}
                      className="rounded-lg px-3 py-1.5 font-medium text-white"
                      style={{ background: club.color_primario }}
                    >
                      {t('socio.pay')}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('socio.activities')}
          </h2>
          {!data ? (
            <p className="mt-3 text-sm text-slate-500">{t('common.loading')}</p>
          ) : data.actividades.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {t('socio.noActivities')}
            </p>
          ) : (
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
              {data.actividades.map((a) => (
                <li key={a.id}>{a.nombre}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('socio.news')}
          </h2>
          {!data ? (
            <p className="mt-3 text-sm text-slate-500">{t('common.loading')}</p>
          ) : data.noticias.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t('socio.noNews')}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.noticias.map((n) => (
                <li key={n.id}>
                  <p className="font-medium text-slate-900">{n.titulo}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {n.cuerpo}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
