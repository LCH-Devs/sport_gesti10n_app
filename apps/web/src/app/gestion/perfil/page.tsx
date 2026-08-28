'use client';

import {
  apiFetch,
  getSession,
  getSocioSession,
  saveSession,
  saveSocioSession,
} from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type StaffProfile = {
  id: number;
  email: string;
  nombre: string;
  rol: string;
};

type MemberProfile = {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
};

type Mode = 'staff' | 'member';

export default function PerfilPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const clubSession = getSession();
    const socioSession = getSocioSession();

    if (clubSession) {
      setMode('staff');
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch<StaffProfile>('/admins/me', {
          token: clubSession.access_token,
          clubSlug: clubSession.club.slug,
        });
        setStaffProfile(data);
        setNombre(data.nombre);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (socioSession) {
      setMode('member');
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch<{ socio: MemberProfile }>('/socio/me', {
          token: socioSession.access_token,
          clubSlug: socioSession.club.slug,
        });
        setMemberProfile(data.socio);
        setNombre(data.socio.nombre);
        setApellido(data.socio.apellido);
        setTelefono(data.socio.telefono);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
      return;
    }

    router.replace('/login');
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    setMsg('');
    setError('');
    try {
      if (mode === 'staff') {
        const clubSession = getSession();
        if (!clubSession || !staffProfile) return;
        const updated = await apiFetch<StaffProfile>('/admins/me', {
          method: 'PATCH',
          token: clubSession.access_token,
          clubSlug: clubSession.club.slug,
          body: JSON.stringify({
            nombre,
            ...(newPassword ? { currentPassword, newPassword } : {}),
          }),
        });
        setStaffProfile(updated);
        saveSession({
          ...clubSession,
          admin: { ...clubSession.admin, nombre: updated.nombre },
        });
        window.dispatchEvent(new Event('club-session-changed'));
      } else if (mode === 'member') {
        const socioSession = getSocioSession();
        if (!socioSession || !memberProfile) return;
        const updated = await apiFetch<MemberProfile>('/socio/me', {
          method: 'PATCH',
          token: socioSession.access_token,
          clubSlug: socioSession.club.slug,
          body: JSON.stringify({
            nombre,
            apellido,
            telefono,
            ...(newPassword ? { currentPassword, newPassword } : {}),
          }),
        });
        setMemberProfile(updated);
        saveSocioSession({
          ...socioSession,
          socio: { ...socioSession.socio, nombre: updated.nombre, apellido: updated.apellido },
        });
        window.dispatchEvent(new Event('club-session-changed'));
      }
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

  if (loading || !mode) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold">Configuración de perfil</h2>
        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-4 text-slate-500">Cargando…</p>
        )}
      </div>
    );
  }

  const email = mode === 'staff' ? staffProfile?.email : memberProfile?.email;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Configuración de perfil</h2>
      <p className="mt-1 text-sm text-slate-600">
        Tus datos personales y contraseña.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}

      <form
        onSubmit={onSave}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Email
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
            value={email || ''}
            disabled
          />
        </label>
        {mode === 'staff' ? (
          <label className="text-sm">
            Rol
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
              value={staffProfile?.rol === 'admin' ? 'Administrador' : 'Entrada'}
              disabled
            />
          </label>
        ) : (
          <label className="text-sm">
            Teléfono
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </label>
        )}
        <label className="text-sm sm:col-span-2">
          Nombre
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        {mode === 'member' && (
          <label className="text-sm sm:col-span-2">
            Apellido
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </label>
        )}

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
            minLength={4}
          />
        </label>
        <label className="text-sm">
          Confirmar nueva contraseña
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={4}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
