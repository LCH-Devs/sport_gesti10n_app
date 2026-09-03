'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { ActividadesHorariosTabs } from '../_components/ActividadesHorariosTabs';
import { FloatingActionButton } from '@/components/common';

type Horario = {
  id: number;
  titulo: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  profe_id: number | null;
  activo: boolean;
};

export default function HorariosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Horario[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Horario[]>('/horarios', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: number) {
    const session = requireSession();
    if (!session || !confirm('¿Eliminar horario?')) return;
    try {
      await apiFetch(`/horarios/${id}`, {
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
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.horarios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.horarios.subtitle')}
      </p>

      <div className="mt-6">
        <ActividadesHorariosTabs />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('admin.horarios.titulo')}</th>
                <th className="px-4 py-3">{t('admin.horarios.dias')}</th>
                <th className="px-4 py-3">{t('admin.espacios.horario')}</th>
                <th className="px-4 py-3">{t('admin.espacios.activo')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{h.titulo}</td>
                  <td className="px-4 py-3">{h.dias}</td>
                  <td className="px-4 py-3">
                    {h.hora_inicio} – {h.hora_fin}
                  </td>
                  <td className="px-4 py-3">{h.activo ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void onDelete(h.id)}
                    >
                      {t('admin.socios.eliminar')}
                    </button>
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

      <FloatingActionButton
        onClick={() => router.push('/horarios/nuevo')}
        aria-label={t('admin.horarios.createHorario')}
        title={t('admin.horarios.createHorario')}
      />
    </div>
  );
}
