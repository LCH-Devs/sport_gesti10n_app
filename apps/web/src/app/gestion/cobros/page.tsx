'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';

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
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
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
      setError(err instanceof Error ? err.message : 'Error al cargar');
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
      setError(err instanceof Error ? err.message : 'Error al cargar la cuenta');
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
        `${data.message} Socios procesados: ${data.socios_procesados}.`,
      );
      await load();
      await loadCuenta();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar');
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
      setError(err instanceof Error ? err.message : 'Error al crear categoría');
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
      setError(err instanceof Error ? err.message : 'Error al actualizar');
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
      setError(err instanceof Error ? err.message : 'Error al borrar');
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
      setError(err instanceof Error ? err.message : 'Error');
    }
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
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-3 py-2">{t('admin.cobros.mes')}</th>
                  <th className="px-3 py-2">{t('admin.cobros.concepto', 'Concepto')}</th>
                  <th className="px-3 py-2">{t('dashboard.member')}</th>
                  <th className="px-3 py-2">{t('admin.cobros.monto')}</th>
                  <th className="px-3 py-2">{t('dashboard.status')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {cuenta.pagos.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono">{p.mes}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs uppercase text-slate-500">
                        {p.tipo === 'inscripcion'
                          ? t('admin.cobros.tipoInscripcion', 'Inscripción')
                          : t('admin.cobros.tipoCuota', 'Cuota')}
                      </span>
                      {p.concepto && (
                        <span className="mt-0.5 block">{p.concepto}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {p.socio.apellido}, {p.socio.nombre}
                    </td>
                    <td className="px-3 py-2">${p.monto}</td>
                    <td className="px-3 py-2">{p.estado}</td>
                    <td className="px-3 py-2 text-right">
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
            {cuenta.pagos.length === 0 && (
              <p className="p-3 text-sm text-slate-500">
                {t('admin.cobros.cuentaVacia', 'Sin movimientos en esta cuenta.')}
              </p>
            )}
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
              <th className="px-4 py-3">{t('admin.cobros.concepto', 'Concepto')}</th>
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
                  {p.grupo_familiar?.nombre && (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {p.grupo_familiar.nombre}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs uppercase text-slate-500">
                    {p.tipo === 'inscripcion'
                      ? t('admin.cobros.tipoInscripcion', 'Inscripción')
                      : t('admin.cobros.tipoCuota', 'Cuota')}
                  </span>
                  {p.concepto && (
                    <span className="mt-0.5 block">{p.concepto}</span>
                  )}
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

export default function CobrosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
      <CobrosPageInner />
    </Suspense>
  );
}
