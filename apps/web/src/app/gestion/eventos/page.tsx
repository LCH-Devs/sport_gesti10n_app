'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { interpolate, useTranslation } from '@/lib/useTranslation';
import { FloatingActionButton, StatusMessage, Badge } from '@/components/common';
import { LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

type Evento = {
  id: number;
  titulo: string;
  tipo: 'seminario' | 'torneo' | 'social';
  visibilidad: 'publico' | 'privado';
  fecha: string;
  lugar: string | null;
  descripcion: string | null;
  publicado: boolean;
  torneo_id: number | null;
};

export default function EventosPage() {
  const { t } = useTranslation();
  const TIPO_LABEL: Record<Evento['tipo'], string> = {
    seminario: t('admin.eventos.tipoSeminario'),
    torneo: t('admin.eventos.tipoTorneo'),
    social: t('admin.eventos.tipoSocial'),
  };
  const router = useRouter();
  const [items, setItems] = useState<Evento[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Evento[]>('/eventos', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(evento: Evento) {
    const session = requireSession();
    if (!session) return;
    if (!confirm(interpolate(t('admin.eventos.confirmDelete'), { titulo: evento.titulo }))) return;
    try {
      await apiFetch(`/eventos/${evento.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.eventos.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t('admin.eventos.subtitle')}</p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 space-y-3">
        {loading ? (
          <StatusMessage>{t('common.loading')}</StatusMessage>
        ) : items.length === 0 ? (
          <p className="text-slate-500">{t('messages.noData')}</p>
        ) : (
          items.map((ev) => (
            <article
              key={ev.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{ev.titulo}</h3>
                    <Badge label={TIPO_LABEL[ev.tipo]} variant="info" />
                    <Badge
                      label={ev.publicado ? t('admin.eventos.publicado') : t('admin.eventos.borrador')}
                      variant={ev.publicado ? 'success' : 'pending'}
                    />
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      {ev.visibilidad === 'publico' ? (
                        <GlobeAltIcon className="h-4 w-4" />
                      ) : (
                        <LockClosedIcon className="h-4 w-4" />
                      )}
                      {ev.visibilidad === 'publico' ? t('admin.eventos.visibilidadPublico') : t('admin.eventos.visibilidadPrivado')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(ev.fecha).toLocaleString('es-AR')}
                    {ev.lugar ? ` · ${ev.lugar}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/eventos/nuevo?id=${ev.id}`)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {t('admin.eventos.editar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(ev)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    {t('admin.eventos.eliminar')}
                  </button>
                </div>
              </div>
              {ev.descripcion && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {ev.descripcion}
                </p>
              )}
              {ev.tipo === 'torneo' && ev.torneo_id && (
                <button
                  type="button"
                  onClick={() => router.push('/torneos')}
                  className="mt-2 text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  {t('admin.eventos.gestionarFixture')}
                </button>
              )}
            </article>
          ))
        )}
      </div>

      <FloatingActionButton
        onClick={() => router.push('/eventos/nuevo')}
        aria-label={t('admin.eventos.nuevoEvento')}
        title={t('admin.eventos.nuevoEvento')}
      />
    </div>
  );
}
