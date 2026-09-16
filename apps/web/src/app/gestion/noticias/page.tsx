'use client';

import { apiFetch, mediaUrl, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { DataTable, FloatingActionButton, Badge, type Column } from '@/components/common';

type Noticia = {
  id: number;
  titulo: string;
  cuerpo: string;
  imagen_url: string | null;
  es_evento: boolean;
  fecha: string;
  published: boolean;
};

export default function NoticiasPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateTimeFormat();
  const router = useRouter();
  const [items, setItems] = useState<Noticia[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Noticia[]>('/noticias', {
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

  async function onDelete(noticia: Noticia) {
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch(`/noticias/${noticia.id}`, {
        method: 'DELETE',
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeleting'));
    }
  }

  const columns: Column<Noticia>[] = [
    {
      key: 'titulo',
      header: t('admin.noticias.titulo'),
      sortable: true,
      render: (n) => (
        <div className="flex items-center gap-3">
          {n.imagen_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(n.imagen_url)}
              alt=""
              className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
            />
          )}
          <span className="font-medium text-slate-900">{n.titulo}</span>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: t('admin.torneos.fecha'),
      sortable: true,
      render: (n) => formatDateTime(n.fecha),
    },
    {
      key: 'es_evento',
      header: t('admin.noticias.esEvento'),
      render: (n) => (n.es_evento ? <Badge label={t('admin.noticias.esEvento')} variant="info" /> : null),
    },
    {
      key: 'published',
      header: t('admin.eventos.publicado'),
      render: (n) => (
        <Badge
          label={n.published ? t('admin.eventos.publicado') : t('admin.eventos.borrador')}
          variant={n.published ? 'success' : 'pending'}
        />
      ),
    },
  ];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold">{t('admin.noticias.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.noticias.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={items}
          getRowId={(n) => n.id}
          loading={loading}
          onEdit={(n) => router.push(`/noticias/nuevo?id=${n.id}`)}
          onDelete={onDelete}
          deleteConfirmMessage={t('admin.noticias.confirmDelete')}
        />
      </div>

      <FloatingActionButton
        onClick={() => router.push('/noticias/nuevo')}
        aria-label={t('admin.noticias.publicar')}
        title={t('admin.noticias.publicar')}
      />
    </div>
  );
}
