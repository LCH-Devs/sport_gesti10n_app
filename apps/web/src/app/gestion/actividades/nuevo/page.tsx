'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

type Profe = { id: number; nombre: string; apellido: string; rol: string };

type Actividad = {
  id: number;
  nombre: string;
  modo_cobro: string;
  monto_adicional: number;
  profe_id: number | null;
  comision_tipo: string | null;
  comision_valor: number | null;
};

function NuevaActividadForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [profes, setProfes] = useState<Profe[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    modo_cobro: 'club',
    monto_adicional: '',
    profe_id: '',
    comision_tipo: 'porcentaje',
    comision_valor: '',
  });

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    try {
      const socios = await apiFetch<Profe[]>('/socios', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setProfes(socios.filter((s) => s.rol === 'profe'));
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
      .then((a) =>
        setForm({
          nombre: a.nombre,
          modo_cobro: a.modo_cobro,
          monto_adicional: a.monto_adicional ? String(a.monto_adicional) : '',
          profe_id: a.profe_id ? String(a.profe_id) : '',
          comision_tipo: a.comision_tipo || 'porcentaje',
          comision_valor: a.comision_valor ? String(a.comision_valor) : '',
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
      if (editingId) {
        await apiFetch(`/actividades/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
      } else {
        await apiFetch('/actividades', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body,
        });
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
