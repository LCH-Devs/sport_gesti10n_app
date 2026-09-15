'use client';

import { useEffect, useState } from 'react';
import { apiFetch, requireSession } from '@/lib/api';
import { Button } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';
import type { CuotaMesEstado, EstadoMesItem } from './CuotaMesCell';

type Persona = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  estado?: string;
  rol?: string;
  categoria?: { nombre: string; monto: number } | null;
};

type FamiliaDetalle = {
  id: number;
  nombre: string;
  titular_id: number;
  titular: Persona;
  socios: Persona[];
};

type PagoRow = {
  id: number;
  mes: string;
  monto: number;
  estado: string;
  tipo?: string;
  concepto?: string | null;
  socio: { id: number; nombre: string; apellido: string };
};

type Cuenta = {
  tipo: 'socio' | 'familia';
  pagos: PagoRow[];
};

export type FichaTarget =
  | { kind: 'socio'; socio: Persona; familiaNombre?: string }
  | { kind: 'familia'; familiaId: number };

function CuotaResumen({
  item,
}: {
  item: EstadoMesItem | undefined;
}) {
  const { t } = useTranslation();
  const estado: CuotaMesEstado = item?.cuota_estado ?? 'sin_generar';
  const label =
    estado === 'pagado'
      ? t('admin.cobros.cuotaPagada', 'Pagó')
      : estado === 'pendiente'
        ? t('admin.cobros.cuotaDebe', 'Debe')
        : estado === 'bonificado'
          ? t('admin.cobros.cuotaBonificada', 'Bonificado')
          : t('admin.cobros.cuotaSinGenerar', 'Sin generar');
  const icon =
    estado === 'pagado' ? (
      <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
    ) : estado === 'pendiente' ? (
      <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
    ) : estado === 'bonificado' ? (
      <MinusCircleIcon className="h-5 w-5 text-slate-400" />
    ) : (
      <QuestionMarkCircleIcon className="h-5 w-5 text-slate-300" />
    );
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span>{label}</span>
      {item?.cuota_monto != null && (
        <span className="tabular-nums font-medium">${item.cuota_monto}</span>
      )}
    </div>
  );
}

export function FichaModal({
  target,
  cuotaMes,
  onClose,
  onEdit,
}: {
  target: FichaTarget;
  cuotaMes: Map<number, EstadoMesItem>;
  onClose: () => void;
  onEdit: (href: string) => void;
}) {
  const { t } = useTranslation();
  const [familia, setFamilia] = useState<FamiliaDetalle | null>(null);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const session = requireSession();
      if (!session) return;
      setLoading(true);
      setError('');
      try {
        if (target.kind === 'familia') {
          const [fam, acc] = await Promise.all([
            apiFetch<FamiliaDetalle>(`/familias/${target.familiaId}`, {
              token: session.access_token,
              clubSlug: session.club.slug,
            }),
            apiFetch<Cuenta>(`/pagos/cuenta?familia_id=${target.familiaId}`, {
              token: session.access_token,
              clubSlug: session.club.slug,
            }),
          ]);
          if (!cancelled) {
            setFamilia(fam);
            setCuenta(acc);
          }
        } else {
          const acc = await apiFetch<Cuenta>(
            `/pagos/cuenta?socio_id=${target.socio.id}`,
            {
              token: session.access_token,
              clubSlug: session.club.slug,
            },
          );
          if (!cancelled) {
            setFamilia(null);
            setCuenta(acc);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [target]);

  const titulo =
    target.kind === 'familia'
      ? familia?.nombre || t('admin.familias.title')
      : `${target.socio.apellido}, ${target.socio.nombre}`;

  const cuotaItem =
    target.kind === 'familia'
      ? familia
        ? cuotaMes.get(familia.titular_id)
        : undefined
      : cuotaMes.get(target.socio.id);

  const editHref =
    target.kind === 'familia'
      ? `/gestion/familias/nuevo?id=${target.familiaId}`
      : `/gestion/socios/nuevo?id=${target.socio.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="ficha-title" className="text-lg font-semibold text-slate-900">
              {titulo}
            </h3>
            {target.kind === 'socio' && target.familiaNombre && (
              <p className="mt-1 text-sm text-slate-500">{target.familiaNombre}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('common.close', 'Cerrar')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          <>
            {target.kind === 'socio' && (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-slate-500">{t('admin.socios.dni')}</dt>
                <dd className="font-mono">{target.socio.dni}</dd>
                <dt className="text-slate-500">{t('admin.socios.email')}</dt>
                <dd>{target.socio.email || '—'}</dd>
                <dt className="text-slate-500">{t('admin.socios.telefono')}</dt>
                <dd>{target.socio.telefono || '—'}</dd>
                <dt className="text-slate-500">{t('admin.socios.estado')}</dt>
                <dd>{target.socio.estado || '—'}</dd>
                <dt className="text-slate-500">{t('admin.socios.rol')}</dt>
                <dd>{target.socio.rol || '—'}</dd>
                <dt className="text-slate-500">{t('admin.socios.categoria')}</dt>
                <dd>
                  {target.socio.categoria?.nombre || 'Socio pleno'}
                  {target.socio.categoria?.monto != null
                    ? ` · $${target.socio.categoria.monto}`
                    : ''}
                </dd>
              </dl>
            )}

            {target.kind === 'familia' && familia && (
              <div className="mt-4">
                <p className="text-sm text-slate-600">
                  {t('admin.familias.titular')}: {familia.titular.apellido},{' '}
                  {familia.titular.nombre}
                </p>
                <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {[...familia.socios]
                    .sort((a, b) => {
                      if (a.id === familia.titular_id) return -1;
                      if (b.id === familia.titular_id) return 1;
                      return a.apellido.localeCompare(b.apellido, 'es');
                    })
                    .map((s) => (
                      <li key={s.id} className="px-3 py-2 text-sm">
                        {s.apellido}, {s.nombre}
                        {s.id === familia.titular_id && (
                          <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                            {t('admin.familias.titular')}
                          </span>
                        )}
                        <span className="ml-2 text-slate-500">{s.dni}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('admin.cobros.cuotaMes', 'Cuota mes')}
              </p>
              <div className="mt-1">
                <CuotaResumen item={cuotaItem} />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('admin.cobros.estadoCuenta', 'Estado de cuenta')}
              </p>
              {cuenta && cuenta.pagos.length > 0 ? (
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {cuenta.pagos.slice(0, 12).map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-mono text-xs text-slate-500">
                          {p.mes}
                        </span>{' '}
                        {p.tipo === 'inscripcion'
                          ? t('admin.cobros.tipoInscripcion', 'Inscripción')
                          : t('admin.cobros.tipoCuota', 'Cuota')}
                      </span>
                      <span>
                        ${p.monto}{' '}
                        <span
                          className={
                            p.estado === 'pagado'
                              ? 'text-emerald-700'
                              : 'text-red-600'
                          }
                        >
                          {p.estado}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  {t('admin.cobros.cuentaVacia', 'Sin movimientos en esta cuenta.')}
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="md" onClick={() => onEdit(editHref)}>
            {t('dataTable.edit', 'Editar')}
          </Button>
          <Button variant="secondary" size="md" onClick={onClose}>
            {t('common.close', 'Cerrar')}
          </Button>
        </div>
      </div>
    </div>
  );
}
