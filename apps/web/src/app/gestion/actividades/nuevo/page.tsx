'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  DIAS_SEMANA,
  parseDias,
  serializeDias,
  type DiaKey,
} from '@/lib/dias-semana';

type Profe = { id: number; nombre: string; apellido: string; rol: string };
type EspacioOpt = { id: number; nombre: string };

type HorarioApi = {
  id: number;
  titulo: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  espacio_id: number | null;
};

type Actividad = {
  id: number;
  nombre: string;
  modo_cobro: string;
  monto_adicional: number;
  profe_id: number | null;
  comision_tipo: string | null;
  comision_valor: number | null;
  horarios: HorarioApi[];
};

type HorarioForm = {
  id?: number;
  titulo: string;
  dias: DiaKey[];
  hora_inicio: string;
  hora_fin: string;
  espacio_id: string;
};

function nuevoHorarioForm(): HorarioForm {
  return { titulo: '', dias: [], hora_inicio: '18:00', hora_fin: '19:30', espacio_id: '' };
}

function NuevaActividadForm() {
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
    nombre: '',
    modo_cobro: 'club',
    monto_adicional: '',
    profe_id: '',
    comision_tipo: 'porcentaje',
    comision_valor: '',
  });
  const [horarios, setHorarios] = useState<HorarioForm[]>([]);
  const [horarioIdsEliminados, setHorarioIdsEliminados] = useState<number[]>([]);

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
    apiFetch<Actividad>(`/actividades/${editingId}`, {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((a) => {
        setForm({
          nombre: a.nombre,
          modo_cobro: a.modo_cobro,
          monto_adicional: a.monto_adicional ? String(a.monto_adicional) : '',
          profe_id: a.profe_id ? String(a.profe_id) : '',
          comision_tipo: a.comision_tipo || 'porcentaje',
          comision_valor: a.comision_valor ? String(a.comision_valor) : '',
        });
        setHorarios(
          (a.horarios ?? []).map((h) => ({
            id: h.id,
            titulo: h.titulo,
            dias: parseDias(h.dias),
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            espacio_id: h.espacio_id ? String(h.espacio_id) : '',
          })),
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('messages.errorLoading')))
      .finally(() => setLoading(false));
  }, [editingId, t]);

  function updateHorario(index: number, patch: Partial<HorarioForm>) {
    setHorarios((list) => list.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  function addHorario() {
    setHorarios((list) => [...list, nuevoHorarioForm()]);
  }

  function removeHorario(index: number) {
    setHorarios((list) => {
      const h = list[index];
      if (h.id) setHorarioIdsEliminados((ids) => [...ids, h.id!]);
      return list.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    if (horarios.some((h) => h.dias.length === 0)) {
      setError(t('admin.horarios.diasRequerido'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = JSON.stringify({
        nombre: form.nombre,
        modo_cobro: form.modo_cobro,
        monto_adicional: form.monto_adicional ? Number(form.monto_adicional) : undefined,
        profe_id:
          form.modo_cobro === 'profe' && form.profe_id ? Number(form.profe_id) : undefined,
        comision_tipo: form.modo_cobro === 'profe' ? form.comision_tipo : undefined,
        comision_valor:
          form.modo_cobro === 'profe' && form.comision_valor
            ? Number(form.comision_valor)
            : undefined,
      });
      let actividadId: number;
      if (editingId) {
        actividadId = Number(editingId);
        await apiFetch(`/actividades/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      } else {
        const creada = await apiFetch<{ id: number }>('/actividades', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
        actividadId = creada.id;
      }

      for (const id of horarioIdsEliminados) {
        await apiFetch(`/horarios/${id}`, {
          method: 'DELETE',
          token: session.access_token,
          clubSlug: session.club.slug,
        });
      }

      for (const h of horarios) {
        const horarioBody = JSON.stringify({
          titulo: h.titulo.trim() || form.nombre,
          dias: serializeDias(h.dias),
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          espacio_id: h.espacio_id ? Number(h.espacio_id) : null,
          actividad_id: actividadId,
        });
        if (h.id) {
          await apiFetch(`/horarios/${h.id}`, {
            method: 'PATCH',
            token: session.access_token,
            clubSlug: session.club.slug,
            body: horarioBody,
          });
        } else {
          await apiFetch('/horarios', {
            method: 'POST',
            token: session.access_token,
            clubSlug: session.club.slug,
            body: horarioBody,
          });
        }
      }

      router.push('/actividades');
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
          {editingId ? t('admin.actividades.editActividad', 'Editar actividad') : t('admin.socios.quickCreate')}
        </h2>
        <p className="mt-6 text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editingId ? t('admin.actividades.editActividad', 'Editar actividad') : t('admin.socios.quickCreate')}
      </h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          label={t('admin.actividades.nombre')}
          value={form.nombre}
          onChange={(nombre) => setForm((f) => ({ ...f, nombre }))}
          required
        />
        <FormField
          as="select"
          label={t('admin.actividades.modoCobro')}
          value={form.modo_cobro}
          onChange={(modo_cobro) => setForm((f) => ({ ...f, modo_cobro }))}
        >
          <option value="club">{t('admin.actividades.club')}</option>
          <option value="profe">{t('admin.actividades.profe')}</option>
        </FormField>
        <FormField
          type="number"
          min={0}
          label={t('admin.actividades.montoAdicional', 'Monto adicional (opcional)')}
          value={form.monto_adicional}
          onChange={(monto_adicional) => setForm((f) => ({ ...f, monto_adicional }))}
        />
        {form.modo_cobro === 'profe' && (
          <>
            <FormField
              as="select"
              label={t('admin.actividades.profeACargo', 'Profe a cargo')}
              value={form.profe_id}
              onChange={(profe_id) => setForm((f) => ({ ...f, profe_id }))}
              required
            >
              <option value="">Elegir…</option>
              {profes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.apellido}, {p.nombre}
                </option>
              ))}
            </FormField>
            <FormField
              as="select"
              label={t('admin.actividades.comisionTipo', 'Tipo de comisión del club')}
              value={form.comision_tipo}
              onChange={(comision_tipo) => setForm((f) => ({ ...f, comision_tipo }))}
            >
              <option value="porcentaje">{t('admin.actividades.porcentaje', 'Porcentaje')}</option>
              <option value="fijo">{t('admin.actividades.fijo', 'Monto fijo')}</option>
            </FormField>
            <FormField
              type="number"
              min={0}
              label={t('admin.actividades.comisionValor', 'Valor de la comisión')}
              value={form.comision_valor}
              onChange={(comision_valor) => setForm((f) => ({ ...f, comision_valor }))}
            />
          </>
        )}

        <fieldset className="sm:col-span-2 mt-2 border-t border-slate-200 pt-4">
          <legend className="text-sm font-semibold text-slate-800">
            {t('admin.horarios.title')}
          </legend>

          <div className="mt-3 space-y-4">
            {horarios.map((h, index) => (
              <div key={h.id ?? `nuevo-${index}`} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <FormField
                    colSpan
                    label={t('admin.horarios.titulo')}
                    value={h.titulo}
                    onChange={(titulo) => updateHorario(index, { titulo })}
                    placeholder={form.nombre}
                  />
                  <button
                    type="button"
                    onClick={() => removeHorario(index)}
                    className="mt-6 text-slate-400 hover:text-red-600"
                    aria-label={t('dataTable.delete', 'Eliminar')}
                    title={t('dataTable.delete', 'Eliminar')}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-600">{t('admin.horarios.dias')}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {DIAS_SEMANA.map((d) => {
                      const checked = h.dias.includes(d.key);
                      return (
                        <label
                          key={d.key}
                          className={`cursor-pointer rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
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
                              updateHorario(index, {
                                dias: checked
                                  ? h.dias.filter((k) => k !== d.key)
                                  : DIAS_SEMANA.map((x) => x.key).filter(
                                      (k) => k === d.key || h.dias.includes(k),
                                    ),
                              })
                            }
                          />
                          {t(`admin.horarios.dia.${d.key}`)}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <FormField
                    type="time"
                    label={t('admin.horarios.horaInicio')}
                    value={h.hora_inicio}
                    onChange={(hora_inicio) => updateHorario(index, { hora_inicio })}
                    required
                  />
                  <FormField
                    type="time"
                    label={t('admin.horarios.horaFin')}
                    value={h.hora_fin}
                    onChange={(hora_fin) => updateHorario(index, { hora_fin })}
                    required
                  />
                  <FormField
                    as="select"
                    label={t('admin.horarios.espacio')}
                    value={h.espacio_id}
                    onChange={(espacio_id) => updateHorario(index, { espacio_id })}
                  >
                    <option value="">{t('admin.horarios.sinEspacio')}</option>
                    {espacios.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </FormField>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addHorario}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <PlusIcon className="h-4 w-4" />
            {t('admin.horarios.createHorario')}
          </button>
        </fieldset>

        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? t('config.guardando') : editingId ? t('config.guardar') : t('admin.actividades.createActividad')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/actividades')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaActividadPage() {
  return (
    <Suspense fallback={null}>
      <NuevaActividadForm />
    </Suspense>
  );
}
