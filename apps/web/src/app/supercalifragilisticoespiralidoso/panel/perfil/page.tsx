'use client';

import { apiFetch, getPlatformSession, savePlatformSession } from '@/lib/api';
import { Header } from '@/components/common';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

type PlatformProfile = {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
};

export default function PlatformPerfilPage() {
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const [nombre, setNombre] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<PlatformProfile>('/platform/admins/me', {
        token: session.access_token,
      });
      setProfile(data);
      setNombre(data.nombre);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const session = getPlatformSession();
    if (!session || !profile) return;

    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    setMsg('');
    setError('');
    try {
      const updated = await apiFetch<PlatformProfile>('/platform/admins/me', {
        method: 'PATCH',
        token: session.access_token,
        body: JSON.stringify({
          nombre,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      setProfile(updated);
      savePlatformSession({
        ...session,
        platform_admin: { ...session.platform_admin, nombre: updated.nombre },
      });
      window.dispatchEvent(new Event('club-session-changed'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg('Perfil actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="Configuración de perfil" />
        <div className="p-6">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-slate-500">Cargando…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Configuración de perfil"
        subtitle="Tus datos de superadmin y contraseña."
      />
      <div className="p-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {msg && <p className="mb-4 text-sm text-green-700">{msg}</p>}

        <form
          onSubmit={onSave}
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <label className="text-sm">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
              value={profile.email}
              disabled
            />
          </label>
          <label className="text-sm">
            Nombre
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </label>

          <hr className="sm:col-span-2 my-2 border-slate-200" />
          <p className="sm:col-span-2 text-sm font-medium text-slate-700">
            Cambiar contraseña (opcional)
          </p>

          <label className="text-sm">
            Contraseña actual
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <div />
          <label className="text-sm">
            Nueva contraseña
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </label>
          <label className="text-sm">
            Confirmar nueva contraseña
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="sm:col-span-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}
