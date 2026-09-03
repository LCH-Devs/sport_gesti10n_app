'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FloatingActionButton } from '@/components/common';

type Noticia = {
  id: number;
  titulo: string;
  cuerpo: string;
  es_evento: boolean;
  fecha: string;
  published: boolean;
};

export default function NoticiasPage() {
  const { t } = useTranslation();
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
      <h2 className="text-2xl font-bold">{t('admin.noticias.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('admin.noticias.subtitle')}
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-slate-500">{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">{t('messages.noData')}</p>
        ) : (
          items.map((n) => (
            <article
              key={n.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{n.titulo}</h3>
                {n.es_evento && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    {t('admin.noticias.esEvento')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(n.fecha).toLocaleString('es-AR')}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {n.cuerpo}
              </p>
            </article>
          ))
        )}
      </div>

      <FloatingActionButton
        onClick={() => router.push('/noticias/nuevo')}
        aria-label={t('admin.noticias.publicar')}
        title={t('admin.noticias.publicar')}
      />
    </div>
  );
}
