'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

type Reserva = {
  id: number;
  inicio: string;
  fin: string;
  estado: string;
  nota: string | null;
  socio_id: number;
  espacio_id: number;
};

type Espacio = { id: number; nombre: string };
type Socio = { id: number; nombre: string; apellido: string; dni: string };

const EMPTY_FORM = {
  espacio_id: '',
  socio_id: '',
  inicio: '',
  fin: '',
};

export default function NuevoReservaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const editId = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const [form, setForm] = useState(EMPTY_FORM);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const session = getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [esp, soc, reserva] = await Promise.all([
          apiFetch<Espacio[]>('/espacios', {
            token: session.access_token,
            clubSlug: session.club.slug,
          }),
          apiFetch<Socio[]>('/socios', {
            token: session.access_token,
            clubSlug: session.club.slug,
          }),
          editId
            ? apiFetch<Reserva>(`/reservas/${editId}`, {
                token: session.access_token,
                clubSlug: session.club.slug,
              })
            : Promise.resolve(null),
        ]);
        setEspacios(esp);
        setSocios(soc);

        if (editId && reserva) {
          setForm({
            espacio_id: String(reserva.espacio_id),
            socio_id: String(reserva.socio_id),
            inicio: reserva.inicio.slice(0, 16),
            fin: reserva.fin.slice(0, 16),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('messages.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [editId, router, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editId) {
        await apiFetch(`/reservas/${editId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify({
            espacio_id: Number(form.espacio_id),
            socio_id: Number(form.socio_id),
            inicio: new Date(form.inicio).toISOString(),
            fin: new Date(form.fin).toISOString(),
          }),
        });
      } else {
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
      }
      router.push('/espacios?tab=reservas');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editId ? t('admin.reservas.editReserva') : t('admin.reservas.newReserva')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {editId
          ? t('admin.reservas.subtitle')
          : t('admin.reservas.createSubtitle', 'Ingresa los datos de la nueva reserva')}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          {t('admin.reservas.espacio')}
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.espacio_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, espacio_id: e.target.value }))
            }
            required
          >
            <option value="">Elegir…</option>
            {espacios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {t('admin.reservas.socio')}
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.socio_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, socio_id: e.target.value }))
            }
            required
          >
            <option value="">Elegir…</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.apellido}, {s.nombre} ({s.dni})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {t('admin.reservas.inicio')}
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.inicio}
            onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm">
          {t('admin.reservas.fin')}
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.fin}
            onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
            required
          />
        </label>

        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? t('newClub.saving', 'Guardando…')
              : editId
                ? t('common.save', 'Guardar')
                : t('admin.reservas.createReserva')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}
