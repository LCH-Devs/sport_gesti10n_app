'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, requireSession } from '@/lib/api';
import { interpolate, useTranslation } from '@/lib/useTranslation';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { Badge, Button } from '@/components/common';
import { PencilIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ReservaEditModal, type ReservaEdit } from './ReservaEditModal';

type Reserva = ReservaEdit & {
  estado: string;
  socio: { id: number; nombre: string; apellido: string; dni: string };
  espacio: { id: number; nombre: string };
};

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  confirmada: 'success',
  cancelada: 'error',
};

export function EspacioReservasModal({
  espacio,
  onClose,
}: {
  espacio: { id: number; nombre: string };
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateTimeFormat();
  const [items, setItems] = useState<Reserva[]>([]);
  const [editing, setEditing] = useState<Reserva | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const reservas = await apiFetch<Reserva[]>(`/reservas?espacio_id=${espacio.id}`, {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setItems(reservas);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [espacio.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function onCancelar(id: number) {
    const session = requireSession();
    if (!session || !confirm(t('admin.reservas.confirmCancelar'))) return;
    try {
      await apiFetch(`/reservas/${id}/cancelar`, {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCancelling'));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="espacio-reservas-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="espacio-reservas-title" className="text-lg font-semibold text-slate-900">
            {interpolate(t('admin.espacios.reservasDe'), { espacio: espacio.nombre })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('common.close', 'Cerrar')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">{t('admin.reservas.socio')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.reservas.inicio')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.reservas.fin')}</th>
                <th className="px-3 py-2 font-medium">{t('admin.reservas.estado')}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    {t('messages.noData')}
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      {r.socio.apellido}, {r.socio.nombre}
                    </td>
                    <td className="px-3 py-2">{formatDateTime(r.inicio)}</td>
                    <td className="px-3 py-2">{formatDateTime(r.fin)}</td>
                    <td className="px-3 py-2">
                      <Badge label={r.estado} variant={ESTADO_VARIANT[r.estado] || 'info'} />
                    </td>
                    <td className="px-3 py-2">
                      {r.estado === 'confirmada' && (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            className="text-slate-500 hover:text-blue-600"
                            aria-label={t('dataTable.edit', 'Editar')}
                            title={t('dataTable.edit', 'Editar')}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onCancelar(r.id)}
                            className="text-slate-500 hover:text-red-600"
                            aria-label={t('admin.reservas.cancelar')}
                            title={t('admin.reservas.cancelar')}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.close', 'Cerrar')}
          </Button>
        </div>
      </div>

      {editing && (
        <ReservaEditModal
          reserva={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
