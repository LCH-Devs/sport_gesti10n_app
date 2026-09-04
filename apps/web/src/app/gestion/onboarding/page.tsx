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

const STEPS = [
  { id: 1, label: 'Titular' },
  { id: 2, label: 'Club' },
  { id: 3, label: 'Deportes y espacios' },
  { id: 4, label: 'Seguridad' },
  { id: 5, label: 'Suscripción' },
] as const;

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;

const DEPORTES_CATALOGO = [
  'Fútbol',
  'Básquet',
  'Pádel',
  'Tenis',
  'Vóley',
  'Natación',
  'Hockey',
] as const;

const ESPACIO_TIPOS = [
  { value: 'cancha', label: 'Cancha' },
  { value: 'padel', label: 'Pádel' },
  { value: 'futbol', label: 'Fútbol' },
  { value: 'basquet', label: 'Básquet' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'quincho', label: 'Quincho' },
  { value: 'salon', label: 'Salón' },
  { value: 'otro', label: 'Otro' },
] as const;

type EspacioBorrador = { nombre: string; tipo: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
  const [deportesSeleccionados, setDeportesSeleccionados] = useState<string[]>([]);
  const [deporteOtro, setDeporteOtro] = useState('');
  const [bloquearEntrada, setBloquearEntrada] = useState(false);
  const [descuentoFamiliar, setDescuentoFamiliar] = useState('');
  const [espacios, setEspacios] = useState<EspacioBorrador[]>([]);
  const [espacioNombre, setEspacioNombre] = useState('');
  const [espacioTipo, setEspacioTipo] = useState<string>(ESPACIO_TIPOS[0].value);
  const [espaciosWarning, setEspaciosWarning] = useState('');

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

  function validateStep1(): string | null {
    if (NAME_REGEX.test(form.titular_nombre) === false || !form.titular_nombre.trim()) {
      return 'Ingresá un nombre válido (solo letras y espacios)';
    }
    if (NAME_REGEX.test(form.titular_apellido) === false || !form.titular_apellido.trim()) {
      return 'Ingresá un apellido válido (solo letras y espacios)';
    }
    const cuitCuilDigits = form.cuit_cuil.replace(/\D/g, '');
    if (cuitCuilDigits.length !== 11) {
      return 'CUIT/CUIL debe tener exactamente 11 dígitos';
    }
    return null;
  }

  function validateStepSeguridad(): string | null {
    if (!PASSWORD_REGEX.test(form.nueva_password)) {
      return 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & * _ - + =)';
    }
    if (form.nueva_password !== form.confirmar_password) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  }

  function toggleDeporte(deporte: string) {
    setDeportesSeleccionados((prev) =>
      prev.includes(deporte) ? prev.filter((d) => d !== deporte) : [...prev, deporte],
    );
  }

  function addEspacio() {
    if (!espacioNombre.trim()) return;
    setEspacios((prev) => [...prev, { nombre: espacioNombre.trim(), tipo: espacioTipo }]);
    setEspacioNombre('');
  }

  function removeEspacio(idx: number) {
    setEspacios((prev) => prev.filter((_, i) => i !== idx));
  }

  function goNext() {
    setError('');
    setPasswordError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    if (step === 4) {
      const err = validateStepSeguridad();
      if (err) {
        setPasswordError(err);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setError('');
    setPasswordError('');
    setStep((s) => Math.max(s - 1, 1));
  }

  async function finish() {
    const session = requireSession();
    if (!session) return;

    setError('');
    setPasswordError('');

    const step1Error = validateStep1();
    if (step1Error) {
      setError(step1Error);
      setStep(1);
      return;
    }
    const seguridadError = validateStepSeguridad();
    if (seguridadError) {
      setPasswordError(seguridadError);
      setStep(4);
      return;
    }

    const cuitCuilDigits = form.cuit_cuil.replace(/\D/g, '');
    const direccionCompleta = `${calleNombre}${altura ? ' ' + altura : ''}`.trim();
    const otros = deporteOtro
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const deportes = [...deportesSeleccionados, ...otros];

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
          deportes: deportes.length ? deportes : undefined,
          bloquear_entrada: bloquearEntrada,
          descuento_familiar_pct: descuentoFamiliar ? Number(descuentoFamiliar) : undefined,
        }),
      });

      let fallidos = 0;
      if (espacios.length) {
        const results = await Promise.allSettled(
          espacios.map((esp) =>
            apiFetch('/espacios', {
              method: 'POST',
              token: session.access_token,
              clubSlug: session.club.slug,
              body: JSON.stringify({ nombre: esp.nombre, tipo: esp.tipo }),
            }),
          ),
        );
        fallidos = results.filter((r) => r.status === 'rejected').length;
      }

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

      if (fallidos > 0) {
        setEspaciosWarning(
          `${fallidos} espacio(s) no se pudieron crear. Podés agregarlos después desde Espacios.`,
        );
        setSaving(false);
        return;
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < STEPS.length) {
      goNext();
    } else {
      void finish();
    }
  }

  if (espaciosWarning) {
    return (
      <div>
        <h2 className="text-2xl font-bold">¡Listo! Ya sos parte de ClubApp</h2>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-800">{espaciosWarning}</p>
        </div>
        <button
          type="button"
          onClick={() => router.replace('/dashboard')}
          className="mt-6 rounded-lg bg-[var(--club-primary)] px-4 py-2.5 font-semibold text-white"
        >
          Ir al panel
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Completá el registro del club</h2>
      <p className="mt-1 text-sm text-slate-600">
        Primer acceso: datos del titular, identidad del club y una contraseña
        nueva.
      </p>

      <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        {STEPS.map((s, idx) => (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full font-semibold ${
                s.id === step
                  ? 'bg-[var(--club-primary)] text-white'
                  : s.id < step
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {s.id < step ? '✓' : s.id}
            </span>
            <span className={s.id === step ? 'font-semibold' : 'text-slate-500'}>
              {s.label}
            </span>
            {idx < STEPS.length - 1 && <span className="mx-1 text-slate-300">—</span>}
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={onFormSubmit}
        className="mt-6 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2"
      >
        {step === 1 && (
          <>
            <label className="text-sm">
              Nombre del titular
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.titular_nombre}
                onChange={(e) => {
                  const val = e.target.value;
                  if (NAME_REGEX.test(val)) {
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
                  if (NAME_REGEX.test(val)) {
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
          </>
        )}

        {step === 2 && (
          <>
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
            <div />
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
            <div />
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
          </>
        )}

        {step === 3 && (
          <>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium">Deportes del club o institución</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DEPORTES_CATALOGO.map((deporte) => (
                  <label key={deporte} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={deportesSeleccionados.includes(deporte)}
                      onChange={() => toggleDeporte(deporte)}
                    />
                    {deporte}
                  </label>
                ))}
              </div>
              <label className="mt-2 block text-sm">
                Otros deportes (separados por coma)
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={deporteOtro}
                  onChange={(e) => setDeporteOtro(e.target.value)}
                  placeholder="Ej: Rugby, Ajedrez"
                />
              </label>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm sm:col-span-2">
              <span>
                <span className="font-medium">Portería</span>
                <span className="block text-xs text-slate-500">
                  Bloquear el ingreso a socios/as que deban cuotas
                </span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={bloquearEntrada}
                onChange={(e) => setBloquearEntrada(e.target.checked)}
              />
            </label>

            <label className="text-sm sm:col-span-2">
              Promoción por grupo familiar (% de descuento sobre la cuota)
              <input
                type="number"
                min={0}
                max={100}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={descuentoFamiliar}
                onChange={(e) => setDescuentoFamiliar(e.target.value)}
                placeholder="Ej: 10"
              />
            </label>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium">Espacios para reserva (opcional)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  value={espacioNombre}
                  onChange={(e) => setEspacioNombre(e.target.value)}
                  placeholder="Ej: Cancha 1"
                />
                <select
                  className="select-field rounded-lg border px-3 py-2 text-sm"
                  value={espacioTipo}
                  onChange={(e) => setEspacioTipo(e.target.value)}
                >
                  {ESPACIO_TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addEspacio}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Agregar
                </button>
              </div>
              {espacios.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {espacios.map((esp, idx) => (
                    <li
                      key={`${esp.nombre}-${idx}`}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                    >
                      <span>
                        {esp.nombre}{' '}
                        <span className="text-slate-400">
                          ({ESPACIO_TIPOS.find((t) => t.value === esp.tipo)?.label})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEspacio(idx)}
                        className="text-xs text-red-600"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Podés agregar más espacios en cualquier momento desde Espacios.
              </p>
            </div>
          </>
        )}

        {step === 4 && (
          <>
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
          </>
        )}

        {step === 5 && (
          <div className="sm:col-span-2">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="font-semibold text-slate-700">
                Medio de pago de la suscripción
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Todavía no habilitamos la carga de tarjeta desde acá. Vas a poder
                completarla más adelante sin que esto interrumpa el uso del club.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-400"
                title="Próximamente"
              >
                Agregar tarjeta (próximamente)
              </button>
            </div>
          </div>
        )}

        <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || saving}
            className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-40"
          >
            Atrás
          </button>
          {step < STEPS.length ? (
            <button
              type="submit"
              className="rounded-lg bg-[var(--club-primary)] px-4 py-2.5 font-semibold text-white"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--club-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Omitir por ahora y finalizar'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
