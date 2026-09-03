'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

type Socio = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
};

const EMPTY_FORM = {
  dni: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
};

function NuevoSocioForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(editingId));

  useEffect(() => {
    if (!editingId) return;
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    apiFetch<Socio>(`/socios/${editingId}`, {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((socio) =>
        setForm({
          dni: socio.dni,
          nombre: socio.nombre,
          apellido: socio.apellido,
          email: socio.email,
          telefono: socio.telefono,
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [editingId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;
    try {
      if (editingId) {
        await apiFetch(`/socios/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/socios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(form),
        });
      }
      router.push('/gestion/socios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editingId ? t('admin.socios.editSocio', 'Editar socio') : t('admin.socios.quickCreate')}
      </h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{t('common.loading', 'Cargando...')}</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          {(
            [
              ['dni', t('admin.socios.dni')],
              ['nombre', t('admin.socios.nombre')],
              ['apellido', t('admin.socios.apellido')],
              ['email', t('admin.socios.email')],
              ['telefono', t('admin.socios.telefono')],
            ] as const
          ).map(([key, label]) => (
            <FormField
              key={key}
              label={label}
              value={form[key]}
              onChange={(value) => setForm((f) => ({ ...f, [key]: value }))}
              required={key !== 'telefono'}
              type={key === 'email' ? 'email' : 'text'}
            />
          ))}
          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
            >
              {editingId ? t('common.save', 'Guardar') : t('admin.socios.createSocio')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/gestion/socios')}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              {t('newClub.cancel', 'Cancelar')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NuevoSocioPage() {
  return (
    <Suspense fallback={null}>
      <NuevoSocioForm />
    </Suspense>
  );
}
