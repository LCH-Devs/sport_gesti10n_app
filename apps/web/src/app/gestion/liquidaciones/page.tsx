'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { DataTable, Badge, type Column } from '@/components/common';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

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
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setMsg(t('admin.liquidaciones.mesCerrado'));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    }
  }

  async function marcarPagada(liquidacion: Liquidacion) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/liquidaciones-profe/${liquidacion.id}/marcar-pagada`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    }
  }

  const profes = socios.filter(
    (s) => !s.rol || s.rol === 'profe' || s.rol === 'profesor',
  );
  const profeOptions = profes.length > 0 ? profes : socios;

  const columns: Column<Liquidacion>[] = [
    { key: 'mes', header: t('admin.liquidaciones.mes'), sortable: true },
    {
      key: 'profe',
      header: t('admin.liquidaciones.profesor'),
      accessor: (l) => `${l.profe.apellido}, ${l.profe.nombre}`,
    },
    {
      key: 'total_club',
      header: t('admin.liquidaciones.totalClub'),
      align: 'right',
      render: (l) => `$${l.total_club}`,
    },
    {
      key: 'estado',
      header: t('dashboard.status'),
      render: (l) => (
        <Badge label={l.estado} variant={l.estado === 'pagada' ? 'success' : 'pending'} />
      ),
    },
  ];

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
          className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
        >
          {t('admin.liquidaciones.cerrarMes')}
        </button>
      </form>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={items}
          getRowId={(l) => l.id}
          loading={loading}
          actions={(l) =>
            l.estado !== 'pagada' ? (
              <button
                type="button"
                onClick={() => void marcarPagada(l)}
                className="text-slate-500 hover:text-green-700"
                aria-label={t('admin.liquidaciones.marcarPagada')}
                title={t('admin.liquidaciones.marcarPagada')}
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            ) : null
          }
        />
      </div>
    </div>
  );
}
