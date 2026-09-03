'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

export default function NuevaNoticiaPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    titulo: '',
    cuerpo: '',
    es_evento: false,
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch('/noticias', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(form),
      });
      router.push('/noticias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.noticias.nueva')}</h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
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
        <FormField
          as="checkbox"
          label={t('admin.noticias.esEvento')}
          checked={form.es_evento}
          onChange={(es_evento) => setForm((f) => ({ ...f, es_evento }))}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
          >
            {t('admin.noticias.publicar')}
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
