'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { DataTable, type Column } from '@/components/common';

type Socio = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  estado: string;
  rol: string;
};

const EMPTY_FORM = {
  dni: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
};

export default function SociosPage() {
  const { t } = useTranslation();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Socio[]>('/socios', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setSocios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onStartEdit(socio: Socio) {
    setEditingId(socio.id);
    setForm({
      dni: socio.dni,
      nombre: socio.nombre,
      apellido: socio.apellido,
      email: socio.email,
      telefono: socio.telefono,
    });
  }

  function onCancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    try {
      if (editingId) {
        await apiFetch(`/socios/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/socios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(form),
        });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  async function onDelete(socio: Socio) {
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch(`/socios/${socio.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const columns: Column<Socio>[] = [
    { key: 'dni', header: t('admin.socios.dni'), sortable: true },
    {
      key: 'apellido',
      header: t('admin.socios.nombre'),
      sortable: true,
      render: (s) => `${s.apellido}, ${s.nombre}`,
    },
    { key: 'email', header: t('admin.socios.email'), sortable: true },
    { key: 'estado', header: t('admin.socios.estado'), sortable: true },
    { key: 'rol', header: t('admin.socios.rol'), sortable: true },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.socios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.socios.subtitle')}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">
          {editingId ? t('admin.socios.editSocio', 'Editar socio') : t('admin.socios.quickCreate')}
        </h3>
        {(
          [
            ['dni', t('admin.socios.dni')],
            ['nombre', t('admin.socios.nombre')],
            ['apellido', t('admin.socios.apellido')],
            ['email', t('admin.socios.email')],
            ['telefono', t('admin.socios.telefono')],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required={key !== 'telefono'}
              type={key === 'email' ? 'email' : 'text'}
            />
          </label>
        ))}
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
          >
            {editingId ? t('common.save', 'Guardar') : t('admin.socios.createSocio')}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              {t('newClub.cancel', 'Cancelar')}
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 rounded-xl border bg-white p-4">
        <h3 className="font-semibold">{t('admin.socios.importCsv')}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {t('admin.socios.csvHeader')}
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="mt-3 block text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const session = getSession();
            if (!session) return;
            const text = await file.text();
            try {
              const result = await apiFetch<{
                created: number;
                updated: number;
                errors: string[];
              }>('/socios/import-csv', {
                method: 'POST',
                token: session.access_token,
                clubSlug: session.club.slug,
                body: JSON.stringify({ csv: text }),
              });
              setError(
                result.errors.length
                  ? `OK ${result.created} altas, ${result.updated} updates. Errores: ${result.errors.slice(0, 3).join('; ')}`
                  : '',
              );
              if (!result.errors.length) {
                alert(
                  `Importados: ${result.created} nuevos, ${result.updated} actualizados`,
                );
              }
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error CSV');
            }
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={socios}
          getRowId={(s) => s.id}
          loading={loading}
          onEdit={onStartEdit}
          onDelete={onDelete}
          deleteConfirmMessage={(s) => `${t('admin.socios.eliminar')} ${s.nombre} ${s.apellido}?`}
        />
      </div>
    </div>
  );
}
