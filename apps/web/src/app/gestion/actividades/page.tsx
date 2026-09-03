'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { ActividadesHorariosTabs } from '../_components/ActividadesHorariosTabs';
import { FloatingActionButton } from '@/components/common';

type Actividad = {
  id: number;
  nombre: string;
  modo_cobro: string;
  monto_adicional: number;
  profe_id: number | null;
  activo: boolean;
};

export default function ActividadesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Actividad[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Actividad[]>('/actividades', {
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

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.actividades.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.actividades.subtitle')}
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
                <th className="px-4 py-3">{t('admin.actividades.nombre')}</th>
                <th className="px-4 py-3">{t('admin.actividades.modoCobro')}</th>
                <th className="px-4 py-3">{t('admin.actividades.adicional')}</th>
                <th className="px-4 py-3">{t('admin.espacios.activo')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{a.nombre}</td>
                  <td className="px-4 py-3">{a.modo_cobro}</td>
                  <td className="px-4 py-3">${a.monto_adicional}</td>
                  <td className="px-4 py-3">{a.activo ? 'Sí' : 'No'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-slate-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <FloatingActionButton
        onClick={() => router.push('/actividades/nuevo')}
        aria-label={t('admin.actividades.createActividad')}
        title={t('admin.actividades.createActividad')}
      />
    </div>
  );
}
