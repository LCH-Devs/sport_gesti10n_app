'use client';

import { apiFetch, getSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type Noticia = {
  id: number;
  titulo: string;
  cuerpo: string;
  es_evento: boolean;
  fecha: string;
  published: boolean;
};

export default function NoticiasPage() {
  const [items, setItems] = useState<Noticia[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    titulo: '',
    cuerpo: '',
    es_evento: false,
  });

  const load = useCallback(async () => {
    const session = getSession();
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    try {
      await apiFetch('/noticias', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify(form),
      });
      setForm({ titulo: '', cuerpo: '', es_evento: false });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Noticias</h2>
      <p className="mt-1 text-sm text-slate-600">
        Noticias y eventos del club.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <h3 className="font-semibold">Nueva publicación</h3>
        <label className="text-sm">
          Título
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          Cuerpo
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={4}
            value={form.cuerpo}
            onChange={(e) => setForm((f) => ({ ...f, cuerpo: e.target.value }))}
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.es_evento}
            onChange={(e) =>
              setForm((f) => ({ ...f, es_evento: e.target.checked }))
            }
          />
          Es evento
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
        >
          Publicar
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-slate-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">Sin noticias.</p>
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
                    Evento
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
    </div>
  );
}
