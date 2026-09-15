'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';
import { ImageUploadField } from '@/components/ImageUploadField';

type Noticia = {
  id: number;
  titulo: string;
  cuerpo: string;
  imagen_url: string | null;
  es_evento: boolean;
  fecha: string;
  published: boolean;
};

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function NuevaNoticiaForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    cuerpo: '',
    imagen_url: '',
    es_evento: false,
    fecha: '',
    published: true,
  });

  useEffect(() => {
    if (!editingId) return;
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    apiFetch<Noticia>(`/noticias/${editingId}`, {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((n) =>
        setForm({
          titulo: n.titulo,
          cuerpo: n.cuerpo,
          imagen_url: n.imagen_url || '',
          es_evento: n.es_evento,
          fecha: n.es_evento && n.fecha ? toDatetimeLocal(n.fecha) : '',
          published: n.published,
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : t('messages.errorLoading')))
      .finally(() => setLoading(false));
  }, [editingId, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        titulo: form.titulo,
        cuerpo: form.cuerpo,
        imagen_url: form.imagen_url || undefined,
        es_evento: form.es_evento,
        fecha: form.es_evento && form.fecha ? new Date(form.fecha).toISOString() : undefined,
        published: form.published,
      });
      if (editingId) {
        await apiFetch(`/noticias/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      } else {
        await apiFetch('/noticias', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      }
      router.push('/noticias');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold">
          {editingId ? t('admin.noticias.editar', 'Editar noticia') : t('admin.noticias.nueva')}
        </h2>
        <p className="mt-6 text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editingId ? t('admin.noticias.editar', 'Editar noticia') : t('admin.noticias.nueva')}
      </h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <FormField
          label={t('admin.noticias.titulo')}
          value={form.titulo}
          onChange={(titulo) => setForm((f) => ({ ...f, titulo }))}
          required
        />
        <FormField
          as="textarea"
          label={t('admin.noticias.cuerpo')}
          rows={4}
          value={form.cuerpo}
          onChange={(cuerpo) => setForm((f) => ({ ...f, cuerpo }))}
          required
        />
        <ImageUploadField
          label={t('admin.noticias.imagen', 'Imagen (opcional)')}
          value={form.imagen_url}
          onChange={(imagen_url) => setForm((f) => ({ ...f, imagen_url }))}
          uploadPath="/noticias/imagenes"
          onError={setError}
        />
        <FormField
          as="checkbox"
          label={t('admin.noticias.esEvento')}
          checked={form.es_evento}
          onChange={(es_evento) => setForm((f) => ({ ...f, es_evento }))}
        />
        {form.es_evento && (
          <FormField
            type="datetime-local"
            label={t('admin.noticias.fechaEvento', 'Fecha del evento')}
            value={form.fecha}
            onChange={(fecha) => setForm((f) => ({ ...f, fecha }))}
            required
          />
        )}
        <FormField
          as="checkbox"
          label={t('admin.noticias.publicada', 'Publicada (visible ya)')}
          checked={form.published}
          onChange={(published) => setForm((f) => ({ ...f, published }))}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? t('config.guardando') : editingId ? t('config.guardar') : t('admin.noticias.publicar')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/noticias')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaNoticiaPage() {
  return (
    <Suspense fallback={null}>
      <NuevaNoticiaForm />
    </Suspense>
  );
}
