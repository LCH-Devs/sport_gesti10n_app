'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

type Espacio = { id: number; nombre: string };
type Socio = { id: number; nombre: string; apellido: string; dni: string };

export default function NuevaReservaPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    espacio_id: '',
    socio_id: '',
    inicio: '',
    fin: '',
  });

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    try {
      const [esp, soc] = await Promise.all([
        apiFetch<Espacio[]>('/espacios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<Socio[]>('/socios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setEspacios(esp);
      setSocios(soc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch('/reservas', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          espacio_id: Number(form.espacio_id),
          socio_id: Number(form.socio_id),
          inicio: new Date(form.inicio).toISOString(),
          fin: new Date(form.fin).toISOString(),
        }),
      });
      router.push('/reservas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.reservas.nueva')}</h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          as="select"
          label={t('admin.reservas.espacio')}
          value={form.espacio_id}
          onChange={(espacio_id) => setForm((f) => ({ ...f, espacio_id }))}
          required
        >
          <option value="">Elegir…</option>
          {espacios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </FormField>
        <FormField
          as="select"
          label={t('admin.reservas.socio')}
          value={form.socio_id}
          onChange={(socio_id) => setForm((f) => ({ ...f, socio_id }))}
          required
        >
          <option value="">Elegir…</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.apellido}, {s.nombre} ({s.dni})
            </option>
          ))}
        </FormField>
        <FormField
          type="datetime-local"
          label={t('admin.reservas.inicio')}
          value={form.inicio}
          onChange={(inicio) => setForm((f) => ({ ...f, inicio }))}
          required
        />
        <FormField
          type="datetime-local"
          label={t('admin.reservas.fin')}
          value={form.fin}
          onChange={(fin) => setForm((f) => ({ ...f, fin }))}
          required
        />
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
          >
            {t('admin.reservas.createReserva')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/reservas')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}
