'use client';

import { apiFetch, getSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
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

type Reserva = {
  id: number;
  inicio: string;
  fin: string;
  estado: string;
  nota: string | null;
  socio: { id: number; nombre: string; apellido: string; dni: string };
  espacio: { id: number; nombre: string };
};

export default function EspaciosPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'espacios' | 'reservas'>(() => {
    const paramTab = searchParams.get('tab');
    return paramTab === 'reservas' ? 'reservas' : 'espacios';
  });

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [esp, res] = await Promise.all([
        apiFetch<Espacio[]>('/espacios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Reserva[]>('/reservas', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setEspacios(esp);
      setReservas(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancelarReserva(id: number) {
    const session = getSession();
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
    <div>
      <h2 className="text-2xl font-bold">{t('admin.espacios.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.espacios.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Tab Toggle */}
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('espacios')}
          className={`px-4 py-2 font-semibold transition ${
            tab === 'espacios'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('admin.espacios.title')}
        </button>
        <button
          type="button"
          onClick={() => setTab('reservas')}
          className={`px-4 py-2 font-semibold transition ${
            tab === 'reservas'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('admin.reservas.title')}
        </button>
      </div>

      {/* Espacios Tab */}
      {tab === 'espacios' && (
        <div className="mt-8">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
                  {espacios.map((e) => (
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
                  {espacios.length === 0 && (
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
          />
        </div>
      )}

      {/* Reservas Tab */}
      {tab === 'reservas' && (
        <div className="mt-8">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
                  {reservas.map((r) => (
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
                            onClick={() => void onCancelarReserva(r.id)}
                          >
                            {t('admin.reservas.cancelar')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reservas.length === 0 && (
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
            onClick={() => router.push('/espacios/reservas/nuevo')}
            aria-label={t('admin.reservas.createReserva')}
          />
        </div>
      )}
    </div>
  );
}
