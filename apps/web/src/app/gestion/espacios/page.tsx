'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { EspaciosReservasTabs } from '../_components/EspaciosReservasTabs';
import { FloatingActionButton } from '@/components/common';

type Espacio = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  activo: boolean;
  duracion_slot_min: number;
  precio_opcional: number | null;
  hora_apertura: string;
  hora_cierre: string;
};

export default function EspaciosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Espacio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Espacio[]>('/espacios', {
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
      <h2 className="text-2xl font-bold">{t('admin.espacios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.espacios.subtitle')}
      </p>

      <div className="mt-6">
        <EspaciosReservasTabs />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('admin.espacios.nombre')}</th>
                <th className="px-4 py-3">{t('admin.espacios.tipo')}</th>
                <th className="px-4 py-3">{t('admin.espacios.slot')}</th>
                <th className="px-4 py-3">{t('admin.espacios.horario')}</th>
                <th className="px-4 py-3">{t('admin.espacios.activo')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{e.nombre}</td>
                  <td className="px-4 py-3">{e.tipo}</td>
                  <td className="px-4 py-3">{e.duracion_slot_min} min</td>
                  <td className="px-4 py-3">
                    {e.hora_apertura} – {e.hora_cierre}
                  </td>
                  <td className="px-4 py-3">{e.activo ? 'Sí' : 'No'}</td>
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
        onClick={() => router.push('/espacios/nuevo')}
        aria-label={t('admin.espacios.createEspacio')}
        title={t('admin.espacios.createEspacio')}
      />
    </div>
  );
}
