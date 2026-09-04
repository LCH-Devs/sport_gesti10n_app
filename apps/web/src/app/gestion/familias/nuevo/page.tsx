'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

type SocioMini = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
};

export default function NuevaFamiliaPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [socios, setSocios] = useState<SocioMini[]>([]);
  const [form, setForm] = useState({ nombre: '', titular_id: '' });
  const [miembros, setMiembros] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    try {
      const soc = await apiFetch<SocioMini[]>('/socios', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch('/familias', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          nombre: form.nombre,
          titular_id: Number(form.titular_id),
          socio_ids: miembros.length ? miembros : undefined,
        }),
      });
      router.push('/gestion/familias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.socios.quickCreate')}</h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{t('common.loading', 'Cargando...')}</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <FormField
            label={t('admin.familias.nombre')}
            value={form.nombre}
            onChange={(nombre) => setForm((f) => ({ ...f, nombre }))}
            required
          />
          <FormField
            as="select"
            label={t('admin.familias.titular')}
            value={form.titular_id}
            onChange={(titular_id) => {
              setForm((f) => ({ ...f, titular_id }));
              setMiembros((prev) => prev.filter((id) => String(id) !== titular_id));
            }}
            required
          >
            <option value="">Elegir…</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.apellido}, {s.nombre} ({s.dni})
              </option>
            ))}
          </FormField>
          <div className="sm:col-span-2">
            <p className="text-sm">{t('admin.familias.miembros', 'Miembros (opcional)')}</p>
            <div className="mt-1 grid max-h-40 gap-1 overflow-y-auto rounded-lg border border-slate-300 p-2 sm:grid-cols-2">
              {socios
                .filter((s) => String(s.id) !== form.titular_id)
                .map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={miembros.includes(s.id)}
                      onChange={(e) =>
                        setMiembros((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id),
                        )
                      }
                    />
                    {s.apellido}, {s.nombre} ({s.dni})
                  </label>
                ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
            >
              {t('admin.familias.createFamilia')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/gestion/familias')}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              {t('newClub.cancel', 'Cancelar')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
