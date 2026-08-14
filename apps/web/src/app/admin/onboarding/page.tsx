'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  applyClubTheme,
  getSession,
  saveSession,
} from '@/lib/api';
import { ClubColorFields } from '@/components/ClubColorFields';
import { ClubLogoField } from '@/components/ClubLogoField';

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titular_nombre: '',
    titular_apellido: '',
    cuit: '',
    cuil: '',
    nombre: '',
    direccion: '',
    telefono_club: '',
    email_contacto: '',
    logo_url: '',
    color_primario: '#2563eb',
    color_secundario: '' as string | null,
    color_terciario: '' as string | null,
    cuota_monto: '5000',
    nueva_password: '',
    confirmar_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    if (!s.must_complete_onboarding) {
      router.replace('/admin');
      return;
    }
    setForm((f) => ({
      ...f,
      nombre: s.club.nombre,
      color_primario: s.club.color_primario,
      color_secundario: s.club.color_secundario || '',
      color_terciario: s.club.color_terciario || '',
      logo_url: s.club.logo_url || '',
      cuota_monto: String(s.club.cuota_monto || 5000),
    }));
    applyClubTheme(s.club);
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    if (form.nueva_password !== form.confirmar_password) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await apiFetch<typeof session.club>('/clubs/me/onboarding', {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          titular_nombre: form.titular_nombre,
          titular_apellido: form.titular_apellido,
          cuit: form.cuit,
          cuil: form.cuil,
          nombre: form.nombre,
          direccion: form.direccion || undefined,
          telefono_club: form.telefono_club || undefined,
          email_contacto: form.email_contacto || undefined,
          logo_url: form.logo_url || undefined,
          color_primario: form.color_primario,
          color_secundario: form.color_secundario || null,
          color_terciario: form.color_terciario || null,
          cuota_monto: Number(form.cuota_monto),
          nueva_password: form.nueva_password,
        }),
      });
      saveSession({
        ...session,
        must_complete_onboarding: false,
        must_change_password: false,
        club: {
          ...session.club,
          ...updated,
        },
      });
      applyClubTheme(updated);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Completá el registro del club</h2>
      <p className="mt-1 text-sm text-slate-600">
        Primer acceso: datos del titular, identidad del club y una contraseña
        nueva.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Nombre del titular
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.titular_nombre}
            onChange={(e) =>
              setForm({ ...form, titular_nombre: e.target.value })
            }
            required
          />
        </label>
        <label className="text-sm">
          Apellido del titular
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.titular_apellido}
            onChange={(e) =>
              setForm({ ...form, titular_apellido: e.target.value })
            }
            required
          />
        </label>
        <label className="text-sm">
          CUIT
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.cuit}
            onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            required
            minLength={8}
          />
        </label>
        <label className="text-sm">
          CUIL
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.cuil}
            onChange={(e) => setForm({ ...form, cuil: e.target.value })}
            required
            minLength={8}
          />
        </label>
        <label className="text-sm">
          Nombre del club
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Cuota base ($)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.cuota_monto}
            onChange={(e) => setForm({ ...form, cuota_monto: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Dirección
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Teléfono del club
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.telefono_club}
            onChange={(e) =>
              setForm({ ...form, telefono_club: e.target.value })
            }
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Email de contacto
          <input
            type="email"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.email_contacto}
            onChange={(e) =>
              setForm({ ...form, email_contacto: e.target.value })
            }
          />
        </label>
        <ClubLogoField
          value={form.logo_url}
          onChange={(logo_url) => setForm({ ...form, logo_url })}
          onError={setError}
        />
        <ClubColorFields
          primario={form.color_primario}
          secundario={form.color_secundario || null}
          terciario={form.color_terciario || null}
          livePreview
          onChange={(next) =>
            setForm({
              ...form,
              color_primario: next.color_primario,
              color_secundario: next.color_secundario,
              color_terciario: next.color_terciario,
            })
          }
        />
        <label className="text-sm sm:col-span-2">
          Nueva contraseña (mínimo 8)
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-lg border px-3 py-2 pr-16"
              value={form.nueva_password}
              onChange={(e) =>
                setForm({ ...form, nueva_password: e.target.value })
              }
              minLength={8}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </label>
        <label className="text-sm sm:col-span-2">
          Confirmar contraseña
          <div className="relative mt-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              className="w-full rounded-lg border px-3 py-2 pr-16"
              value={form.confirmar_password}
              onChange={(e) =>
                setForm({ ...form, confirmar_password: e.target.value })
              }
              minLength={8}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={
                showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'
              }
            >
              {showConfirm ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          {form.confirmar_password.length > 0 &&
            form.nueva_password !== form.confirmar_password && (
              <p className="mt-1 text-xs text-red-600">
                Las contraseñas no coinciden
              </p>
            )}
        </label>
        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 rounded-lg bg-[var(--club-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Finalizar registro'}
        </button>
      </form>
    </div>
  );
}
