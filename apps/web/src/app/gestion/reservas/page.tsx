'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { EspaciosReservasTabs } from '../_components/EspaciosReservasTabs';
import { FloatingActionButton } from '@/components/common';

type Reserva = {
  id: number;
  inicio: string;
  fin: string;
  estado: string;
  nota: string | null;
  socio: { id: number; nombre: string; apellido: string; dni: string };
  espacio: { id: number; nombre: string };
};

export default function ReservasPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Reserva[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const reservas = await apiFetch<Reserva[]>('/reservas', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setItems(reservas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancelar(id: number) {
    const session = requireSession();
    if (!session || !confirm('¿Cancelar reserva?')) return;
    try {
      await apiFetch(`/reservas/${id}/cancelar`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
    }
  }

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.reservas.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.reservas.subtitle')}
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
                <th className="px-4 py-3">{t('admin.reservas.espacio')}</th>
                <th className="px-4 py-3">{t('admin.reservas.socio')}</th>
                <th className="px-4 py-3">{t('admin.reservas.inicio')}</th>
                <th className="px-4 py-3">{t('admin.reservas.fin')}</th>
                <th className="px-4 py-3">{t('admin.reservas.estado')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{r.espacio.nombre}</td>
                  <td className="px-4 py-3">
                    {r.socio.apellido}, {r.socio.nombre}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.inicio).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.fin).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">{r.estado}</td>
                  <td className="px-4 py-3 text-right">
                    {r.estado === 'confirmada' && (
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => void onCancelar(r.id)}
                      >
                        {t('admin.reservas.cancelar')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-slate-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <FloatingActionButton
        onClick={() => router.push('/reservas/nuevo')}
        aria-label={t('admin.reservas.createReserva')}
        title={t('admin.reservas.createReserva')}
      />
    </div>
  );
}
