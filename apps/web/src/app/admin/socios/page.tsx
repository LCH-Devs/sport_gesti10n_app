'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';

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

export default function SociosPage() {
  const { t } = useTranslation();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
  });

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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch('/socios', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(form),
      });
      setForm({ dni: '', nombre: '', apellido: '', email: '', telefono: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  async function onDelete(id: number) {
    const session = getSession();
    if (!session) return;
    if (!confirm('¿Eliminar socio?')) return;
    try {
      await apiFetch(`/socios/${id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.socios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.socios.subtitle')}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h3 className="sm:col-span-2 font-semibold">{t('admin.socios.quickCreate')}</h3>
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
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          {t('admin.socios.createSocio')}
        </button>
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

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('admin.socios.dni')}</th>
                <th className="px-4 py-3">{t('admin.socios.nombre')}</th>
                <th className="px-4 py-3">{t('admin.socios.email')}</th>
                <th className="px-4 py-3">{t('admin.socios.estado')}</th>
                <th className="px-4 py-3">{t('admin.socios.rol')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {socios.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono">{s.dni}</td>
                  <td className="px-4 py-3">
                    {s.apellido}, {s.nombre}
                  </td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.estado}</td>
                  <td className="px-4 py-3">{s.rol}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void onDelete(s.id)}
                    >
                      {t('admin.socios.eliminar')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
