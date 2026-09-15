'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, requireSession } from '@/lib/api';
import { Button } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FormField } from './FormField';
import { ReservaHorarioPicker } from './ReservaHorarioPicker';
import { hmFromDate, localIso, todayYmd } from '@/lib/reserva-slots';

export type ReservaEdit = {
  id: number;
  inicio: string;
  fin: string;
  nota: string | null;
  socio: { id: number };
  espacio: { id: number };
};

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

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startKey(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
}

export function ReservaEditModal({
  reserva,
  onClose,
  onSaved,
}: {
  reserva: ReservaEdit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [extraInicios, setExtraInicios] = useState<string[]>([]);
  const [form, setForm] = useState({
    espacio_id: String(reserva.espacio.id),
    socio_id: String(reserva.socio.id),
    fecha: toLocalDate(reserva.inicio),
    hora_inicio: hmFromDate(reserva.inicio),
    hora_fin: hmFromDate(reserva.fin),
    nota: reserva.nota ?? '',
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
        const currentStart = hmFromDate(reserva.inicio);
        const todos = data.todos ?? [];
        setExtraInicios(todos.map((s) => startKey(s.inicio)).filter(Boolean));
        setOcupados(
          new Set(
            todos
              .filter((s) => !s.libre && startKey(s.inicio) !== currentStart)
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
  }, [form.espacio_id, form.fecha, reserva.inicio]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
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
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/reservas/${reserva.id}`, {
        method: 'PATCH',
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
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserva-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="reserva-edit-title" className="text-lg font-semibold text-slate-900">
            {t('admin.reservas.editReserva')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('common.close', 'Cerrar')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
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
          <div className="sm:col-span-2 mt-1 flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? t('admin.eventos.guardando') : t('admin.eventos.guardarCambios')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('newClub.cancel', 'Cancelar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
