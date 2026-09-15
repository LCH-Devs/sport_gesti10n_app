'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';
import {
  DIAS_SEMANA,
  parseDias,
  serializeDias,
  type DiaKey,
} from '@/lib/dias-semana';

type Profe = { id: number; nombre: string; apellido: string; rol: string };

type Horario = {
  id: number;
  titulo: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  profe_id: number | null;
  espacio_id: number | null;
  activo: boolean;
};

type EspacioOpt = { id: number; nombre: string };

function NuevoHorarioForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [profes, setProfes] = useState<Profe[]>([]);
  const [espacios, setEspacios] = useState<EspacioOpt[]>([]);
  const [form, setForm] = useState({
    titulo: '',
    dias: [] as DiaKey[],
    hora_inicio: '18:00',
    hora_fin: '19:30',
    profe_id: '',
    espacio_id: '',
  });

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    try {
      const [socios, canchas] = await Promise.all([
        apiFetch<Profe[]>('/socios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<EspacioOpt[]>('/espacios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setProfes(socios.filter((s) => s.rol === 'profe'));
      setEspacios(canchas);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!editingId) return;
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    apiFetch<Horario>(`/horarios/${editingId}`, {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((h) =>
        setForm({
          titulo: h.titulo,
          dias: parseDias(h.dias),
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          profe_id: h.profe_id ? String(h.profe_id) : '',
          espacio_id: h.espacio_id ? String(h.espacio_id) : '',
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : t('messages.errorLoading')))
      .finally(() => setLoading(false));
  }, [editingId, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    if (form.dias.length === 0) {
      setError(t('admin.horarios.diasRequerido'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        titulo: form.titulo,
        dias: serializeDias(form.dias),
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        profe_id: form.profe_id ? Number(form.profe_id) : undefined,
        espacio_id: form.espacio_id ? Number(form.espacio_id) : null,
      });
      if (editingId) {
        await apiFetch(`/horarios/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      } else {
        await apiFetch('/horarios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      }
      router.push('/horarios');
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
          {editingId ? t('admin.horarios.editHorario', 'Editar horario') : t('admin.socios.quickCreate')}
        </h2>
        <p className="mt-6 text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editingId ? t('admin.horarios.editHorario', 'Editar horario') : t('admin.socios.quickCreate')}
      </h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          colSpan
          label={t('admin.horarios.titulo')}
          value={form.titulo}
          onChange={(titulo) => setForm((f) => ({ ...f, titulo }))}
          required
        />
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-slate-700">{t('admin.horarios.dias')}</legend>
          <p className="mt-0.5 text-xs text-slate-500">{t('admin.horarios.diasHint')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIAS_SEMANA.map((d) => {
              const checked = form.dias.includes(d.key);
              return (
                <label
                  key={d.key}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    checked
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        dias: checked
                          ? f.dias.filter((k) => k !== d.key)
                          : DIAS_SEMANA.map((x) => x.key).filter(
                              (k) => k === d.key || f.dias.includes(k),
                            ),
                      }))
                    }
                  />
                  {t(`admin.horarios.dia.${d.key}`)}
                </label>
              );
            })}
          </div>
        </fieldset>
        <FormField
          type="time"
          label={t('admin.horarios.horaInicio')}
          value={form.hora_inicio}
          onChange={(hora_inicio) => setForm((f) => ({ ...f, hora_inicio }))}
          required
        />
        <FormField
          type="time"
          label={t('admin.horarios.horaFin')}
          value={form.hora_fin}
          onChange={(hora_fin) => setForm((f) => ({ ...f, hora_fin }))}
          required
        />
        <FormField
          as="select"
          colSpan
          label={t('admin.horarios.espacio')}
          value={form.espacio_id}
          onChange={(espacio_id) => setForm((f) => ({ ...f, espacio_id }))}
        >
          <option value="">{t('admin.horarios.sinEspacio')}</option>
          {espacios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </FormField>
        <FormField
          as="select"
          colSpan
          label={t('admin.horarios.profe', 'Profe a cargo (opcional)')}
          value={form.profe_id}
          onChange={(profe_id) => setForm((f) => ({ ...f, profe_id }))}
        >
          <option value="">Sin asignar</option>
          {profes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.apellido}, {p.nombre}
            </option>
          ))}
        </FormField>
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? t('config.guardando') : editingId ? t('config.guardar') : t('admin.horarios.createHorario')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/horarios')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevoHorarioPage() {
  return (
    <Suspense fallback={null}>
      <NuevoHorarioForm />
    </Suspense>
  );
}
