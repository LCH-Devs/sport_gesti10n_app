'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormField } from '../../_components/FormField';
import { ImageUploadField } from '@/components/ImageUploadField';
import { LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/useTranslation';

type EventoTipo = 'seminario' | 'torneo' | 'social';
type EventoVisibilidad = 'publico' | 'privado';

type Evento = {
  id: number;
  titulo: string;
  tipo: EventoTipo;
  visibilidad: EventoVisibilidad;
  fecha: string;
  lugar: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  publicado: boolean;
};

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function NuevoEventoForm() {
  const { t } = useTranslation();
  const TIPOS: { value: EventoTipo; label: string }[] = [
    { value: 'seminario', label: t('admin.eventos.tipoSeminario') },
    { value: 'torneo', label: t('admin.eventos.tipoTorneo') },
    { value: 'social', label: t('admin.eventos.tipoSocial') },
  ];
  const VISIBILIDADES: {
    value: EventoVisibilidad;
    label: string;
    icon: typeof LockClosedIcon;
  }[] = [
    { value: 'privado', label: t('admin.eventos.visibilidadPrivadoHint'), icon: LockClosedIcon },
    { value: 'publico', label: t('admin.eventos.visibilidadPublicoHint'), icon: GlobeAltIcon },
  ];
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'seminario' as EventoTipo,
    visibilidad: 'privado' as EventoVisibilidad,
    fecha: '',
    lugar: '',
    descripcion: '',
    imagen_url: '',
    publicado: false,
  });

  useEffect(() => {
    if (!editingId) return;
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    apiFetch<Evento>(`/eventos/${editingId}`, {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((ev) =>
        setForm({
          titulo: ev.titulo,
          tipo: ev.tipo,
          visibilidad: ev.visibilidad,
          fecha: toDatetimeLocal(ev.fecha),
          lugar: ev.lugar || '',
          descripcion: ev.descripcion || '',
          imagen_url: ev.imagen_url || '',
          publicado: ev.publicado,
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : t('messages.errorLoading')))
      .finally(() => setLoading(false));
  }, [editingId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        titulo: form.titulo,
        tipo: form.tipo,
        visibilidad: form.visibilidad,
        fecha: new Date(form.fecha).toISOString(),
        lugar: form.lugar || undefined,
        descripcion: form.descripcion || undefined,
        imagen_url: form.imagen_url || undefined,
        publicado: form.publicado,
      });
      if (editingId) {
        await apiFetch(`/eventos/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      } else {
        await apiFetch('/eventos', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      }
      router.push('/eventos');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.eventos.errorGuardar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold">
          {editingId ? t('admin.eventos.editarEvento') : t('admin.eventos.nuevoEvento')}
        </h2>
        <p className="mt-6 text-sm text-slate-500">{t('admin.eventos.cargando')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editingId ? t('admin.eventos.editarEvento') : t('admin.eventos.nuevoEvento')}
      </h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          colSpan
          label={t('admin.eventos.titulo')}
          value={form.titulo}
          onChange={(titulo) => setForm((f) => ({ ...f, titulo }))}
          required
        />

        <div className="sm:col-span-2">
          <p className="text-sm">{t('admin.eventos.tipoEventoLabel')}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {TIPOS.map((tipoOpt) => (
              <button
                key={tipoOpt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, tipo: tipoOpt.value }))}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.tipo === tipoOpt.value
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tipoOpt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm">{t('admin.eventos.visibilidadLabel')}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {VISIBILIDADES.map((v) => {
              const Icon = v.icon;
              const active = form.visibilidad === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, visibilidad: v.value }))}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        <FormField
          type="datetime-local"
          label={t('admin.eventos.fechaHora')}
          value={form.fecha}
          onChange={(fecha) => setForm((f) => ({ ...f, fecha }))}
          required
        />
        <FormField
          label={t('admin.eventos.lugar')}
          value={form.lugar}
          onChange={(lugar) => setForm((f) => ({ ...f, lugar }))}
        />

        <FormField
          as="textarea"
          colSpan
          label={t('admin.eventos.descripcion')}
          value={form.descripcion}
          onChange={(descripcion) => setForm((f) => ({ ...f, descripcion }))}
        />

        <ImageUploadField
          label={t('admin.eventos.imagen', 'Imagen / flyer (opcional)')}
          value={form.imagen_url}
          onChange={(imagen_url) => setForm((f) => ({ ...f, imagen_url }))}
          uploadPath="/eventos/imagenes"
          onError={setError}
        />

        <FormField
          as="checkbox"
          colSpan
          label={t('admin.eventos.publicadoCheck')}
          checked={form.publicado}
          onChange={(publicado) => setForm((f) => ({ ...f, publicado }))}
        />

        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? t('admin.eventos.guardando') : editingId ? t('admin.eventos.guardarCambios') : t('admin.eventos.crearEvento')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/eventos')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('admin.eventos.cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevoEventoPage() {
  return (
    <Suspense fallback={null}>
      <NuevoEventoForm />
    </Suspense>
  );
}
