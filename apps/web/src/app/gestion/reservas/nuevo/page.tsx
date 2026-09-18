'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';
import { ReservaHorarioPicker } from '../../_components/ReservaHorarioPicker';
import { localIso, todayYmd } from '@/lib/reserva-slots';

type Espacio = {
  id: number;
  nombre: string;
  hora_apertura: string;
  hora_cierre: string;
  duracion_slot_min: number;
};

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  es_socio: boolean;
};

type Disponibilidad = {
  todos: Array<{ inicio: string; libre: boolean }>;
};

function startKey(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
}

function NuevaReservaForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const espacioIdParam = searchParams.get('espacio_id');
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [extraInicios, setExtraInicios] = useState<string[]>([]);
  const [form, setForm] = useState({
    espacio_id: espacioIdParam ?? '',
    socio_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    nota: '',
  });

  const espacio = useMemo(
    () => espacios.find((e) => String(e.id) === form.espacio_id),
    [espacios, form.espacio_id],
  );
  const hoy = todayYmd();

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
      setSocios(soc.filter((persona) => persona.es_socio));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!form.espacio_id || !form.fecha) {
      setOcupados(new Set());
      setExtraInicios([]);
      return;
    }
    const session = requireSession();
    if (!session) return;
    let cancelled = false;
    void apiFetch<Disponibilidad>(
      `/espacios/${form.espacio_id}/disponibilidad?fecha=${form.fecha}`,
      { token: session.access_token, clubSlug: session.club.slug },
    )
      .then((data) => {
        if (cancelled) return;
        const todos = data.todos ?? [];
        setExtraInicios(todos.map((s) => startKey(s.inicio)).filter(Boolean));
        setOcupados(
          new Set(
            todos
              .filter((s) => !s.libre)
              .map((s) => startKey(s.inicio))
              .filter(Boolean),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setOcupados(new Set());
          setExtraInicios([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [form.espacio_id, form.fecha]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session || !espacio) return;
    if (!form.hora_inicio || !form.hora_fin) {
      setError(t('admin.reservas.elegirInicioPrimero'));
      return;
    }
    if (new Date(`${form.fecha}T${form.hora_inicio}`).getTime() < Date.now()) {
      setError(t('admin.reservas.fechaPasada'));
      return;
    }
    try {
      setError('');
      await apiFetch('/reservas', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          espacio_id: Number(form.espacio_id),
          socio_id: Number(form.socio_id),
          inicio: localIso(form.fecha, form.hora_inicio),
          fin: localIso(form.fecha, form.hora_fin),
          nota: form.nota || undefined,
        }),
      });
      router.push('/espacios');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreating'));
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
          onChange={(espacio_id) =>
            setForm((f) => ({ ...f, espacio_id, hora_inicio: '', hora_fin: '' }))
          }
          required
        >
          <option value="">Elegir…</option>
          {espacios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre} ({e.duracion_slot_min} min)
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
          type="date"
          colSpan
          label={t('admin.reservas.fecha')}
          value={form.fecha}
          onChange={(fecha) => setForm((f) => ({ ...f, fecha }))}
          required
          min={hoy}
        />
        <ReservaHorarioPicker
          espacio={espacio}
          fecha={form.fecha}
          horaInicio={form.hora_inicio}
          horaFin={form.hora_fin}
          ocupados={ocupados}
          extraInicios={extraInicios}
          onChange={(next) =>
            setForm((f) => ({ ...f, hora_inicio: next.hora_inicio, hora_fin: next.hora_fin }))
          }
        />
        <FormField
          as="textarea"
          colSpan
          rows={2}
          label={t('admin.reservas.nota', 'Nota (opcional)')}
          value={form.nota}
          onChange={(nota) => setForm((f) => ({ ...f, nota }))}
        />
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white"
          >
            {t('admin.reservas.createReserva')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/espacios')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaReservaPage() {
  return (
    <Suspense fallback={null}>
      <NuevaReservaForm />
    </Suspense>
  );
}
