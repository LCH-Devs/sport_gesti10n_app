'use client';

import { apiFetch, mediaUrl, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { interpolate, useTranslation } from '@/lib/useTranslation';
import { FloatingActionButton, StatusMessage, Badge } from '@/components/common';
import { LockClosedIcon, GlobeAltIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type EventoTipo = 'seminario' | 'torneo' | 'social';

type Evento = {
  id: number;
  titulo: string;
  tipo: EventoTipo;
  visibilidad: 'publico' | 'privado';
  fecha: string;
  lugar: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  publicado: boolean;
  torneo_id: number | null;
};

type Filtro = 'todos' | EventoTipo;

export default function EventosPage() {
  const { t } = useTranslation();
  const TIPO_LABEL: Record<Evento['tipo'], string> = {
    seminario: t('admin.eventos.tipoSeminario'),
    torneo: t('admin.eventos.tipoTorneo'),
    social: t('admin.eventos.tipoSocial'),
  };
  const router = useRouter();
  const [items, setItems] = useState<Evento[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'todos', label: t('admin.eventos.filtroTodos', 'Todos') },
    { key: 'torneo', label: t('admin.eventos.tipoTorneo') },
    { key: 'seminario', label: t('admin.eventos.tipoSeminario') },
    { key: 'social', label: t('admin.eventos.tipoSocial') },
  ];
  const itemsFiltrados = filtro === 'todos' ? items : items.filter((ev) => ev.tipo === filtro);

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

      <div className="mt-6 flex flex-wrap gap-1">
        {filtros.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={`-mb-px whitespace-nowrap rounded-t-lg border-x border-t px-4 py-2 text-sm font-medium transition-colors ${
              filtro === f.key
                ? 'border-slate-200 border-b-white bg-white text-slate-900'
                : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="-mt-px space-y-3 rounded-b-xl rounded-tr-xl border border-slate-200 bg-slate-50 p-4">
        {loading ? (
          <StatusMessage>{t('common.loading')}</StatusMessage>
        ) : itemsFiltrados.length === 0 ? (
          <p className="text-slate-500">{t('messages.noData')}</p>
        ) : (
          itemsFiltrados.map((ev) => (
            <article
              key={ev.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-1 gap-3">
                  {ev.imagen_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(ev.imagen_url)}
                      alt=""
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    />
                  )}
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
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/eventos/nuevo?id=${ev.id}`)}
                    className="text-slate-500 hover:text-blue-600"
                    aria-label={t('admin.eventos.editar')}
                    title={t('admin.eventos.editar')}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(ev)}
                    className="text-slate-500 hover:text-red-600"
                    aria-label={t('admin.eventos.eliminar')}
                    title={t('admin.eventos.eliminar')}
                  >
                    <TrashIcon className="h-4 w-4" />
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
