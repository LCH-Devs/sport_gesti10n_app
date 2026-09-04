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
  rol: string;
  estado: string;
  fecha_nacimiento: string | null;
};

const EMPTY_FORM = {
  dni: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  rol: 'socio',
  estado: 'activo',
  password: '',
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
          fecha_nacimiento: socio.fecha_nacimiento
            ? socio.fecha_nacimiento.slice(0, 10)
            : '',
          rol: socio.rol,
          estado: socio.estado,
          password: '',
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
          body: JSON.stringify({
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono || undefined,
            fecha_nacimiento: form.fecha_nacimiento || undefined,
            rol: form.rol,
            estado: form.estado,
          }),
        });
      } else {
        await apiFetch('/socios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify({
            dni: form.dni,
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono || undefined,
            fecha_nacimiento: form.fecha_nacimiento || undefined,
            rol: form.rol,
            password: form.password || undefined,
          }),
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
          <FormField
            label={t('admin.socios.dni')}
            value={form.dni}
            onChange={(dni) => setForm((f) => ({ ...f, dni }))}
            required
            disabled={Boolean(editingId)}
          />
          <FormField
            label={t('admin.socios.nombre')}
            value={form.nombre}
            onChange={(nombre) => setForm((f) => ({ ...f, nombre }))}
            required
          />
          <FormField
            label={t('admin.socios.apellido')}
            value={form.apellido}
            onChange={(apellido) => setForm((f) => ({ ...f, apellido }))}
            required
          />
          <FormField
            type="email"
            label={t('admin.socios.email')}
            value={form.email}
            onChange={(email) => setForm((f) => ({ ...f, email }))}
            required
          />
          <FormField
            label={t('admin.socios.telefono')}
            value={form.telefono}
            onChange={(telefono) => setForm((f) => ({ ...f, telefono }))}
          />
          <FormField
            type="date"
            label={t('admin.socios.fechaNacimiento', 'Fecha de nacimiento')}
            value={form.fecha_nacimiento}
            onChange={(fecha_nacimiento) => setForm((f) => ({ ...f, fecha_nacimiento }))}
          />
          <FormField
            as="select"
            label={t('admin.socios.rol', 'Rol')}
            value={form.rol}
            onChange={(rol) => setForm((f) => ({ ...f, rol }))}
          >
            <option value="socio">{t('admin.socios.rolSocio', 'Socio')}</option>
            <option value="profe">{t('admin.socios.rolProfe', 'Profe')}</option>
          </FormField>
          {editingId && (
            <FormField
              as="select"
              label={t('admin.socios.estado', 'Estado')}
              value={form.estado}
              onChange={(estado) => setForm((f) => ({ ...f, estado }))}
            >
              <option value="activo">{t('admin.socios.estadoActivo', 'Activo')}</option>
              <option value="moroso">{t('admin.socios.estadoMoroso', 'Moroso')}</option>
              <option value="suspendido">{t('admin.socios.estadoSuspendido', 'Suspendido')}</option>
            </FormField>
          )}
          {!editingId && (
            <FormField
              type="password"
              label={t('admin.socios.passwordOpcional', 'Contraseña inicial (opcional)')}
              value={form.password}
              onChange={(password) => setForm((f) => ({ ...f, password }))}
              minLength={4}
            />
          )}
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
