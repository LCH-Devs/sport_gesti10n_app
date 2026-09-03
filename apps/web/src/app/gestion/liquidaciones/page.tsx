'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

type Liquidacion = {
  id: number;
  mes: string;
  total_club: number;
  estado: string;
  profe: { id: number; nombre: string; apellido: string; dni: string };
};

type Socio = { id: number; nombre: string; apellido: string; dni: string; rol?: string };

function mesDefault() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function LiquidacionesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Liquidacion[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ mes: mesDefault(), profe_id: '' });

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [liqs, soc] = await Promise.all([
        apiFetch<Liquidacion[]>('/liquidaciones-profe', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Socio[]>('/socios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setItems(liqs);
      setSocios(soc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCerrarMes(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    setMsg('');
    try {
      await apiFetch('/liquidaciones-profe/cerrar-mes', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          mes: form.mes,
          profe_id: Number(form.profe_id),
        }),
      });
      setMsg('Mes cerrado / liquidación actualizada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar mes');
    }
  }

  async function marcarPagada(id: number) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/liquidaciones-profe/${id}/marcar-pagada`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  const profes = socios.filter(
    (s) => !s.rol || s.rol === 'profe' || s.rol === 'profesor',
  );
  const profeOptions = profes.length > 0 ? profes : socios;

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.liquidaciones.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.liquidaciones.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}

      <form
        onSubmit={onCerrarMes}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
      >
        <h3 className="w-full font-semibold">{t('admin.liquidaciones.cerrarMes')}</h3>
        <label className="text-sm">
          {t('admin.liquidaciones.mes')}
          <input
            className="mt-1 block rounded-lg border px-3 py-2"
            value={form.mes}
            onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))}
            pattern="\d{4}-\d{2}"
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.liquidaciones.profesor')}
          <select
            className="select-field mt-1 block min-w-[200px]"
            value={form.profe_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, profe_id: e.target.value }))
            }
            required
          >
            <option value="">Elegir…</option>
            {profeOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.apellido}, {s.nombre} ({s.dni})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          {t('admin.liquidaciones.cerrarMes')}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('admin.liquidaciones.mes')}</th>
                <th className="px-4 py-3">{t('admin.liquidaciones.profesor')}</th>
                <th className="px-4 py-3">{t('admin.liquidaciones.totalClub')}</th>
                <th className="px-4 py-3">{t('dashboard.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{l.mes}</td>
                  <td className="px-4 py-3">
                    {l.profe.apellido}, {l.profe.nombre}
                  </td>
                  <td className="px-4 py-3">${l.total_club}</td>
                  <td className="px-4 py-3">{l.estado}</td>
                  <td className="px-4 py-3 text-right">
                    {l.estado !== 'pagada' && (
                      <button
                        type="button"
                        className="text-green-700 hover:underline"
                        onClick={() => void marcarPagada(l.id)}
                      >
                        {t('admin.liquidaciones.marcarPagada')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-slate-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
