'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  applyClubTheme,
  getSession,
  requireSession,
  saveSession,
} from '@/lib/api';
import { ClubColorFields } from '@/components/ClubColorFields';
import { ClubLogoField } from '@/components/ClubLogoField';
import {
  PlaceAutocomplete,
  type GeoRefLocalidad,
  type GeoRefCalle,
} from '@/components/PlaceAutocomplete';

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [form, setForm] = useState({
    titular_nombre: '',
    titular_apellido: '',
    cuit_cuil: '',
    provincia: '',
    ciudad: '',
    telefono_club: '',
    logo_url: '',
    color_primario: '#2563eb',
    color_secundario: '' as string | null,
    color_terciario: '' as string | null,
    cuota_monto: '5000',
    nueva_password: '',
    confirmar_password: '',
  });
  const [ubicacion, setUbicacion] = useState<{
    provincia?: { id: string; nombre: string };
    localidad?: { id: string; nombre: string };
    calle?: { id: string; nombre: string };
  } | null>(null);
  const [calleNombre, setCalleNombre] = useState('');
  const [altura, setAltura] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    if (!s.must_complete_onboarding) {
      router.replace('/dashboard');
      return;
    }
    setForm((f) => ({
      ...f,
      color_primario: s.club.color_primario,
      color_secundario: s.club.color_secundario || '',
      color_terciario: s.club.color_terciario || '',
      logo_url: s.club.logo_url || '',
      cuota_monto: String(s.club.cuota_monto || 5000),
    }));
    applyClubTheme(s.club);
  }, [router]);

  function validatePassword(password: string): string | null {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;
    if (!regex.test(password)) {
      return 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & * _ - + =)';
    }
    return null;
  }

  function validateName(name: string): string | null {
    const regex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/;
    if (!regex.test(name)) {
      return 'Solo se permiten letras, tildes y espacios';
    }
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = requireSession();
    if (!session) return;

    setError('');
    setPasswordError('');

    // Validar nombres
    const nameError = validateName(form.titular_nombre);
    if (nameError) {
      setError(nameError);
      return;
    }
    const surnameError = validateName(form.titular_apellido);
    if (surnameError) {
      setError(surnameError);
      return;
    }

    // Validar CUIT/CUIL (11 dígitos)
    const cuitCuilDigits = form.cuit_cuil.replace(/\D/g, '');
    if (cuitCuilDigits.length !== 11) {
      setError('CUIT/CUIL debe tener exactamente 11 dígitos');
      return;
    }

    // Validar contraseña
    const pwError = validatePassword(form.nueva_password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    if (form.nueva_password !== form.confirmar_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const direccionCompleta = `${calleNombre}${altura ? ' ' + altura : ''}`.trim();

    setSaving(true);
    try {
      const updated = await apiFetch<typeof session.club>('/clubs/me/onboarding', {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          titular_nombre: form.titular_nombre,
          titular_apellido: form.titular_apellido,
          cuit_cuil: cuitCuilDigits,
          provincia: form.provincia,
          ciudad: form.ciudad,
          direccion: direccionCompleta || undefined,
          telefono_club: form.telefono_club || undefined,
          logo_url: form.logo_url || undefined,
          color_primario: form.color_primario,
          color_secundario: form.color_secundario || null,
          color_terciario: form.color_terciario || null,
          cuota_monto: Number(form.cuota_monto),
          nueva_password: form.nueva_password,
          ubicacion_json: ubicacion || undefined,
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
      router.replace('/dashboard');
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
            onChange={(e) => {
              const val = e.target.value;
              const regex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/;
              if (regex.test(val)) {
                setForm({ ...form, titular_nombre: val });
              }
            }}
            placeholder="Ej: Juan"
            required
          />
        </label>
        <label className="text-sm">
          Apellido del titular
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.titular_apellido}
            onChange={(e) => {
              const val = e.target.value;
              const regex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/;
              if (regex.test(val)) {
                setForm({ ...form, titular_apellido: val });
              }
            }}
            placeholder="Ej: Pérez"
            required
          />
        </label>
        <label className="text-sm">
          CUIT/CUIL
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.cuit_cuil}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              let formatted = '';
              if (val.length > 0) {
                formatted = val.slice(0, 2);
              }
              if (val.length > 2) {
                formatted += '-' + val.slice(2, 10);
              }
              if (val.length > 10) {
                formatted += '-' + val.slice(10, 11);
              }
              setForm({ ...form, cuit_cuil: formatted });
            }}
            placeholder="XX-XXXXXXXX-X"
            maxLength={13}
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
            placeholder="Ej: 5000"
            required
          />
        </label>
        <PlaceAutocomplete<GeoRefLocalidad>
          label="Ciudad/Provincia"
          value={form.ciudad}
          onChange={(val) => setForm({ ...form, ciudad: val })}
          onSelect={(localidad) => {
            setUbicacion((prev) => ({
              ...prev,
              provincia: {
                id: localidad.provincia.id,
                nombre: localidad.provincia.nombre,
              },
              localidad: {
                id: localidad.id,
                nombre: localidad.nombre,
              },
            }));
            setForm({ ...form, provincia: localidad.provincia.nombre });
          }}
          fetchUrl={(query) =>
            `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(
              query,
            )}&campos=id,nombre,provincia&max=10`
          }
          resultsKey="localidades"
          formatOption={(item) => `${item.nombre} (${item.provincia.nombre})`}
          placeholder="Escribí el nombre de la ciudad..."
        />
        <PlaceAutocomplete<GeoRefCalle>
          label="Calle"
          value={calleNombre}
          onChange={setCalleNombre}
          onSelect={(calle) => {
            setUbicacion((prev) => ({
              ...prev,
              calle: {
                id: calle.id,
                nombre: calle.nombre,
              },
            }));
            setCalleNombre(calle.nombre);
          }}
          fetchUrl={(query) => {
            const params = new URLSearchParams({
              nombre: query,
              max: '10',
            });
            if (ubicacion?.provincia?.id) {
              params.append('provincia', ubicacion.provincia.id);
            }
            if (ubicacion?.localidad?.id) {
              params.append('localidad', ubicacion.localidad.id);
            }
            return `https://apis.datos.gob.ar/georef/api/calles?${params.toString()}`;
          }}
          resultsKey="calles"
          formatOption={(item) => item.nombre}
          placeholder="Escribí el nombre de la calle..."
        />
        <label className="text-sm">
          Altura (número)
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={altura}
            onChange={(e) => setAltura(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 1234"
            inputMode="numeric"
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
            placeholder="Ej: 11 2345-6789"
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
          Nueva contraseña
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-lg border px-3 py-2 pr-16"
              value={form.nueva_password}
              onChange={(e) => {
                setForm({ ...form, nueva_password: e.target.value });
                setPasswordError('');
              }}
              placeholder="Mínimo 8 caracteres"
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
          {form.nueva_password.length > 0 && (
            <p className="mt-1 text-xs text-slate-600">
              Mínimo 8 caracteres: una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & * _ - + =)
            </p>
          )}
        </label>
        {passwordError && (
          <p className="sm:col-span-2 text-sm text-red-600">{passwordError}</p>
        )}
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
              placeholder="Repetí la contraseña"
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
