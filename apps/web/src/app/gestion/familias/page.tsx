'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/useTranslation';
import { SociosFamiliasTabs } from '../_components/SociosFamiliasTabs';
import { DataTable, type Column, FloatingActionButton } from '@/components/common';
import { CuotaMesCell, type EstadoMesItem } from '../_components/CuotaMesCell';

type SocioMini = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email?: string;
};

type Familia = {
  id: number;
  nombre: string;
  titular_id: number;
  titular: SocioMini;
  socios: SocioMini[];
};

function FamiliasPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = Number(searchParams.get('id') || '') || null;
  const [items, setItems] = useState<Familia[]>([]);
  const [cuotaMes, setCuotaMes] = useState<Map<number, EstadoMesItem>>(new Map());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(focusId);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [familias, estado] = await Promise.all([
        apiFetch<Familia[]>('/familias', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<{ items: EstadoMesItem[] }>('/pagos/estado-mes', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }).catch(() => ({ items: [] as EstadoMesItem[] })),
      ]);
      setItems(familias);
      setCuotaMes(new Map(estado.items.map((i) => [i.socio_id, i])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (focusId) setExpandedId(focusId);
  }, [focusId]);

  useEffect(() => {
    if (!focusId || loading) return;
    const el = document.getElementById(`datatable-row-${focusId}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusId, loading, items, expandedId]);

  async function removeFamilia(row: Familia) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/familias/${row.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al borrar');
    }
  }

  const columns: Column<Familia>[] = [
    { key: 'nombre', header: t('admin.familias.nombre'), sortable: true },
    {
      key: 'titular',
      header: t('admin.familias.titular'),
      sortable: true,
      accessor: (f) => `${f.titular.apellido}, ${f.titular.nombre} ${f.titular.dni}`,
      render: (f) => `${f.titular.apellido}, ${f.titular.nombre}`,
    },
    {
      key: 'miembros',
      header: t('admin.familias.miembros'),
      sortable: true,
      accessor: (f) =>
        `${String(f.socios.length).padStart(4, '0')} ${f.socios
          .map((s) => `${s.apellido} ${s.nombre} ${s.dni} ${s.email || ''}`)
          .join(' ')}`,
      render: (f) => f.socios.length,
    },
    {
      key: 'cuota_mes',
      header: t('admin.cobros.cuotaMes', 'Cuota mes'),
      sortable: true,
      accessor: (f) => cuotaMes.get(f.titular_id)?.cuota_estado || 'sin_generar',
      render: (f) => (
        <CuotaMesCell
          item={cuotaMes.get(f.titular_id)}
          href={`/cobros?familia=${f.id}`}
        />
      ),
    },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.familias.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.familias.subtitle')}
      </p>
      <div className="mt-6">
        <SociosFamiliasTabs />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={items}
          getRowId={(f) => f.id}
          loading={loading}
          searchPlaceholder={t(
            'admin.familias.searchHint',
            'Buscar por grupo, titular o miembro…',
          )}
          expandedRowId={expandedId}
          onExpandedChange={(id) =>
            setExpandedId(id == null ? null : Number(id))
          }
          renderExpanded={(f) => {
            const members = [...f.socios].sort((a, b) => {
              if (a.id === f.titular_id) return -1;
              if (b.id === f.titular_id) return 1;
              return `${a.apellido} ${a.nombre}`.localeCompare(
                `${b.apellido} ${b.nombre}`,
                'es',
                { sensitivity: 'base' },
              );
            });
            return (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.familias.grupoCompleto', 'Grupo familiar')}
                </p>
                <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                  {members.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <span>
                        {s.apellido}, {s.nombre}
                        {s.id === f.titular_id && (
                          <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                            {t('admin.familias.titular')}
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500">
                        {s.dni}
                        {s.email ? ` · ${s.email}` : ''}
                      </span>
                      <Link
                        href={`/cobros?socio=${s.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        {t('admin.cobros.verCuenta', 'Ver estado de cuenta')}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }}
          onEdit={(f) => router.push(`/gestion/familias/nuevo?id=${f.id}`)}
          onDelete={removeFamilia}
          deleteConfirmMessage={() =>
            t('admin.familias.confirmDelete', '¿Borrar este grupo familiar?')
          }
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/gestion/familias/nuevo')}
        aria-label={t('admin.familias.createFamilia')}
        title={t('admin.familias.createFamilia')}
      />
    </div>
  );
}

export default function FamiliasPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
      <FamiliasPageInner />
    </Suspense>
  );
}
