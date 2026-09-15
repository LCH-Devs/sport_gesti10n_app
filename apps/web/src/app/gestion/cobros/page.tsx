'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { DataTable, Badge, type Column } from '@/components/common';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

type PagoRow = {
  id: number;
  mes: string;
  monto: number;
  estado: string;
  tipo?: string;
  concepto?: string | null;
  mp_init_point: string | null;
  grupo_familiar?: { id: number; nombre: string } | null;
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

type CategoriaCuota = {
  id: number;
  nombre: string;
  monto: number;
  es_default: boolean;
};

type Cuenta = {
  tipo: 'socio' | 'familia';
  socio?: {
    id: number;
    dni: string;
    nombre: string;
    apellido: string;
  };
  familia?: {
    id: number;
    nombre: string;
    titular?: { nombre: string; apellido: string };
  };
  pagos: PagoRow[];
};

function mesDefault() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function CobrosPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const socioId = searchParams.get('socio');
  const familiaId = searchParams.get('familia');
  const [mes, setMes] = useState(mesDefault());
  const [monto, setMonto] = useState('');
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaCuota[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', monto: '' });
  const [savingCategoria, setSavingCategoria] = useState(false);

  const loadCategorias = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    try {
      const rows = await apiFetch<CategoriaCuota[]>('/categorias-cuota', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setCategorias(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    }
  }, []);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    try {
      const data = await apiFetch<Resumen>(
        `/pagos/resumen?mes=${encodeURIComponent(mes)}`,
        { token: session.access_token, clubSlug: session.club.slug },
      );
      setResumen(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    }
  }, [mes]);

  const loadCuenta = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    if (!socioId && !familiaId) {
      setCuenta(null);
      return;
    }
    const qs = socioId
      ? `socio_id=${encodeURIComponent(socioId)}`
      : `familia_id=${encodeURIComponent(familiaId || '')}`;
    try {
      const data = await apiFetch<Cuenta>(`/pagos/cuenta?${qs}`, {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setCuenta(data);
    } catch (err) {
      setCuenta(null);
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    }
  }, [socioId, familiaId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCuenta();
  }, [loadCuenta]);

  useEffect(() => {
    void loadCategorias();
  }, [loadCategorias]);

  async function onGenerar(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
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
        `${data.message} ${t('admin.cobros.sociosProcesados')}: ${data.socios_procesados}.`,
      );
      await load();
      await loadCuenta();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorGenerating'));
    } finally {
      setLoading(false);
    }
  }

  async function addCategoria(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    if (!nuevaCategoria.nombre.trim() || nuevaCategoria.monto === '') return;
    setSavingCategoria(true);
    setError('');
    try {
      await apiFetch('/categorias-cuota', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          nombre: nuevaCategoria.nombre.trim(),
          monto: Number(nuevaCategoria.monto),
        }),
      });
      setNuevaCategoria({ nombre: '', monto: '' });
      await loadCategorias();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreating'));
    } finally {
      setSavingCategoria(false);
    }
  }

  async function updateCategoriaMonto(id: number, monto: string) {
    const session = requireSession();
    if (!session) return;
    const value = Number(monto);
    if (Number.isNaN(value) || value < 0) return;
    try {
      await apiFetch(`/categorias-cuota/${id}`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({ monto: value }),
      });
      await loadCategorias();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorUpdating'));
    }
  }

  async function removeCategoria(id: number) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/categorias-cuota/${id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await loadCategorias();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  async function marcarPagado(id: number) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/pagos/${id}/marcar-manual`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
      await loadCuenta();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  }

  const cuentaColumns: Column<PagoRow>[] = [
    { key: 'mes', header: t('admin.cobros.mes') },
    {
      key: 'concepto',
      header: t('admin.cobros.concepto', 'Concepto'),
      render: (p) => (
        <>
          <span className="text-xs uppercase text-slate-500">
            {p.tipo === 'inscripcion'
              ? t('admin.cobros.tipoInscripcion', 'Inscripción')
              : t('admin.cobros.tipoCuota', 'Cuota')}
          </span>
          {p.concepto && <span className="mt-0.5 block">{p.concepto}</span>}
        </>
      ),
    },
    {
      key: 'socio',
      header: t('dashboard.member'),
      accessor: (p) => `${p.socio.apellido}, ${p.socio.nombre}`,
    },
    { key: 'monto', header: t('admin.cobros.monto'), align: 'right', render: (p) => `$${p.monto}` },
    {
      key: 'estado',
      header: t('dashboard.status'),
      render: (p) => <Badge label={p.estado} variant={p.estado === 'pagado' ? 'success' : 'pending'} />,
    },
  ];

  const pagosColumns: Column<PagoRow>[] = [
    {
      key: 'socio',
      header: t('dashboard.member'),
      render: (p) => (
        <>
          {p.socio.apellido}, {p.socio.nombre}
          {p.grupo_familiar?.nombre && (
            <span className="mt-0.5 block text-xs text-slate-500">{p.grupo_familiar.nombre}</span>
          )}
        </>
      ),
    },
    {
      key: 'concepto',
      header: t('admin.cobros.concepto', 'Concepto'),
      render: (p) => (
        <>
          <span className="text-xs uppercase text-slate-500">
            {p.tipo === 'inscripcion'
              ? t('admin.cobros.tipoInscripcion', 'Inscripción')
              : t('admin.cobros.tipoCuota', 'Cuota')}
          </span>
          {p.concepto && <span className="mt-0.5 block">{p.concepto}</span>}
        </>
      ),
    },
    { key: 'dni', header: t('dashboard.dni'), accessor: (p) => p.socio.dni },
    { key: 'monto', header: t('admin.cobros.monto'), align: 'right', render: (p) => `$${p.monto}` },
    {
      key: 'estado',
      header: t('dashboard.status'),
      render: (p) => <Badge label={p.estado} variant={p.estado === 'pagado' ? 'success' : 'pending'} />,
    },
    {
      key: 'link',
      header: t('admin.cobros.link'),
      render: (p) =>
        p.mp_init_point ? (
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
        ),
    },
  ];

  function marcarPagadoAction(p: PagoRow) {
    return p.estado !== 'pagado' ? (
      <button
        type="button"
        onClick={() => void marcarPagado(p.id)}
        className="text-slate-500 hover:text-green-700"
        aria-label={t('admin.cobros.marcarPagado')}
        title={t('admin.cobros.marcarPagado')}
      >
        <CheckCircleIcon className="h-4 w-4" />
      </button>
    ) : null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.cobros.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.cobros.subtitle')}
      </p>

      {cuenta && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                {t('admin.cobros.estadoCuenta', 'Estado de cuenta')}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {cuenta.tipo === 'familia' && cuenta.familia
                  ? `${cuenta.familia.nombre}${
                      cuenta.familia.titular
                        ? ` · ${cuenta.familia.titular.apellido}, ${cuenta.familia.titular.nombre}`
                        : ''
                    }`
                  : cuenta.socio
                    ? `${cuenta.socio.apellido}, ${cuenta.socio.nombre}`
                    : ''}
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-slate-600 hover:underline"
              onClick={() => router.push('/cobros')}
            >
              {t('admin.cobros.cerrarCuenta', 'Ver todos los cobros')}
            </button>
          </div>
          <div className="mt-4">
            <DataTable
              columns={cuentaColumns}
              data={cuenta.pagos}
              getRowId={(p) => p.id}
              emptyMessage={t('admin.cobros.cuentaVacia', 'Sin movimientos en esta cuenta.')}
              actions={marcarPagadoAction}
            />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-4">
        <h3 className="font-semibold">{t('admin.cobros.categoriasTitle')}</h3>
        <p className="mt-1 text-xs text-slate-500">{t('admin.cobros.categoriasHint')}</p>
        <ul className="mt-3 space-y-2">
          {categorias.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="min-w-[10rem] font-medium">
                {c.nombre}
                {c.es_default && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    ({t('admin.cobros.defaultBadge')})
                  </span>
                )}
              </span>
              <input
                type="number"
                min={0}
                defaultValue={c.monto}
                key={`${c.id}-${c.monto}`}
                className="w-28 rounded-lg border px-2 py-1"
                onBlur={(e) => {
                  if (Number(e.target.value) !== c.monto) {
                    void updateCategoriaMonto(c.id, e.target.value);
                  }
                }}
              />
              {!c.es_default && (
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => void removeCategoria(c.id)}
                >
                  {t('admin.socios.eliminar')}
                </button>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => void addCategoria(e)} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            {t('admin.cobros.categoriaNombre')}
            <input
              className="mt-1 block rounded-lg border px-3 py-2"
              value={nuevaCategoria.nombre}
              onChange={(e) =>
                setNuevaCategoria((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Ej: Deportivo"
            />
          </label>
          <label className="text-sm">
            {t('admin.cobros.categoriaMonto')}
            <input
              type="number"
              min={0}
              className="mt-1 block rounded-lg border px-3 py-2"
              value={nuevaCategoria.monto}
              onChange={(e) =>
                setNuevaCategoria((f) => ({ ...f, monto: e.target.value }))
              }
              placeholder="0"
            />
          </label>
          <button
            type="submit"
            disabled={savingCategoria}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
          >
            {savingCategoria
              ? t('admin.cobros.savingCategoria')
              : t('admin.cobros.addCategoria')}
          </button>
        </form>
      </div>

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
          className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
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

      <div className="mt-6">
        <DataTable
          columns={pagosColumns}
          data={resumen?.pagos || []}
          getRowId={(p) => p.id}
          emptyMessage={t('admin.cobros.sinPagos')}
          actions={marcarPagadoAction}
        />
      </div>
    </div>
  );
}

export default function CobrosPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">{t('common.loading')}</p>}>
      <CobrosPageInner />
    </Suspense>
  );
}
