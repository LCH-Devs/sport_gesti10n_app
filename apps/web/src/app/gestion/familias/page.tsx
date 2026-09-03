'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { SociosFamiliasTabs } from '../_components/SociosFamiliasTabs';
import { FloatingActionButton } from '@/components/common';

type SocioMini = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
};

type Familia = {
  id: number;
  nombre: string;
  titular_id: number;
  titular: SocioMini;
  socios: SocioMini[];
};

export default function FamiliasPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Familia[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const familias = await apiFetch<Familia[]>('/familias', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setItems(familias);
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
      <h2 className="text-2xl font-bold">{t('admin.familias.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.familias.subtitle')}
      </p>
      <div className="mt-6">
        <SociosFamiliasTabs />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{t('admin.familias.nombre')}</th>
                <th className="px-4 py-3">{t('admin.familias.titular')}</th>
                <th className="px-4 py-3">{t('admin.familias.miembros')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{f.nombre}</td>
                  <td className="px-4 py-3">
                    {f.titular.apellido}, {f.titular.nombre}
                  </td>
                  <td className="px-4 py-3">{f.socios.length}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-slate-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <FloatingActionButton
        onClick={() => router.push('/gestion/familias/nuevo')}
        aria-label={t('admin.familias.createFamilia')}
        title={t('admin.familias.createFamilia')}
      />
    </div>
  );
}
