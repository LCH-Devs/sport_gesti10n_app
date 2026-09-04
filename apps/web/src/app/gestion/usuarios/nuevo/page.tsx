'use client';

import { apiFetch, requireSession } from '@/lib/api';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';

export default function NuevoUsuarioPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    nombre: '',
    password: '',
    passwordConfirm: '',
    rol: 'admin',
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setError(t('admin.usuarios.passwordNoCoincide', 'Las contraseñas no coinciden'));
      return;
    }
    const session = requireSession();
    if (!session) return;
    try {
      await apiFetch('/admins', {
        method: 'POST',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          email: form.email,
          nombre: form.nombre,
          password: form.password,
          rol: form.rol,
        }),
      });
      router.push('/gestion/usuarios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('admin.usuarios.alta')}</h2>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <FormField
          label={t('admin.usuarios.nombre')}
          value={form.nombre}
          onChange={(nombre) => setForm((f) => ({ ...f, nombre }))}
          required
        />
        <FormField
          type="email"
          label={t('admin.usuarios.email')}
          value={form.email}
          onChange={(email) => setForm((f) => ({ ...f, email }))}
          required
        />
        <FormField
          type="password"
          label={t('admin.usuarios.password')}
          value={form.password}
          onChange={(password) => setForm((f) => ({ ...f, password }))}
          required
          minLength={4}
        />
        <FormField
          type="password"
          label={t('admin.usuarios.passwordConfirm', 'Confirmar contraseña')}
          value={form.passwordConfirm}
          onChange={(passwordConfirm) => setForm((f) => ({ ...f, passwordConfirm }))}
          required
          minLength={4}
        />
        <FormField
          as="select"
          label={t('admin.usuarios.rol')}
          value={form.rol}
          onChange={(rol) => setForm((f) => ({ ...f, rol }))}
        >
          <option value="admin">{t('dashboard.admin')}</option>
          <option value="entrada">{t('dashboard.entrada')}</option>
        </FormField>
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white"
          >
            {t('admin.usuarios.createUsuario')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/gestion/usuarios')}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            {t('newClub.cancel', 'Cancelar')}
          </button>
        </div>
      </form>
    </div>
  );
}
