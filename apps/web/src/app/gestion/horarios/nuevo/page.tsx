'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

type Profe = { id: number; nombre: string; apellido: string; rol: string };

export default function NuevoHorarioPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState('');
  const [profes, setProfes] = useState<Profe[]>([]);
  const [form, setForm] = useState({
    titulo: '',
    dias: 'lun,mie,vie',
    hora_inicio: '18:00',
    hora_fin: '19:30',
    profe_id: '',
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
      await apiFetch('/horarios', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          titulo: form.titulo,
          dias: form.dias,
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin,
          profe_id: form.profe_id ? Number(form.profe_id) : undefined,
        }),
      });
      router.push('/horarios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.socios.quickCreate')}</h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          colSpan
          label={t('admin.horarios.titulo')}
          value={form.titulo}
          onChange={(titulo) => setForm((f) => ({ ...f, titulo }))}
          required
        />
        <FormField
          label={t('admin.horarios.dias')}
          value={form.dias}
          onChange={(dias) => setForm((f) => ({ ...f, dias }))}
          required
        />
        <FormField
          label={t('admin.horarios.horaInicio')}
          value={form.hora_inicio}
          onChange={(hora_inicio) => setForm((f) => ({ ...f, hora_inicio }))}
          required
        />
        <FormField
          label={t('admin.horarios.horaFin')}
          value={form.hora_fin}
          onChange={(hora_fin) => setForm((f) => ({ ...f, hora_fin }))}
          required
        />
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
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
          >
            {t('admin.horarios.createHorario')}
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
