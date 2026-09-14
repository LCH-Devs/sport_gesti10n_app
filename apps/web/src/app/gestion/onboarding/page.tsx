'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  applyClubTheme,
  getSession,
  requireSession,
  saveSession,
  type ClubSession,
} from '@/lib/api';
import { useChrome } from '@/lib/ChromeContext';
import { ClubColorFields } from '@/components/ClubColorFields';
import { ClubLogoField } from '@/components/ClubLogoField';
import {
  PlaceAutocomplete,
  type GeoRefLocalidad,
  type GeoRefCalle,
} from '@/components/PlaceAutocomplete';
import { DeportesPicker } from '@/components/DeportesPicker';
import { VerificarTarjetaCard } from '@/components/VerificarTarjetaCard';
import { deporteKey, mergeDeportes } from '@/lib/deportes-catalogo';
import { NAME_HELP, NAME_PATTERN, PHONE_PATTERN, filterPersonName, filterPhone } from '@/lib/validation';

const STEPS = [
  { id: 1, label: 'Titular' },
  { id: 2, label: 'Club' },
  { id: 3, label: 'Deportes y espacios' },
  { id: 4, label: 'Seguridad' },
  { id: 5, label: 'Verificación' },
] as const;

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;

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
type ExtraCategoria = { nombre: string; monto: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [titularNombreError, setTitularNombreError] = useState('');
  const [titularApellidoError, setTitularApellidoError] = useState('');
  const [form, setForm] = useState({
    titular_nombre: '',
    titular_apellido: '',
    cuit_cuil: '',
    provincia: '',
    ciudad: '',
    pais: '',
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
    pais?: string;
  } | null>(null);
  const [direccionTexto, setDireccionTexto] = useState('');
  const [ciudadDisplay, setCiudadDisplay] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deportesSeleccionados, setDeportesSeleccionados] = useState<string[]>([]);
  const [deportesExtras, setDeportesExtras] = useState<string[]>([]);
  const [espacios, setEspacios] = useState<EspacioBorrador[]>([]);
  const [extrasCategoria, setExtrasCategoria] = useState<ExtraCategoria[]>([]);
  const [espacioExtraDraft, setEspacioExtraDraft] = useState('');
  const [espaciosWarning, setEspaciosWarning] = useState('');
  const [session, setSession] = useState<ClubSession | null>(null);
  const [tarjetaVerificada, setTarjetaVerificada] = useState(false);
  const [tarjetaPortal, setTarjetaPortal] = useState<HTMLDivElement | null>(null);

  const { setHideChrome } = useChrome();

  useEffect(() => {
    setHideChrome(true);
    return () => setHideChrome(false);
  }, [setHideChrome]);

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
    setSession(s);
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
    if (!form.titular_nombre.trim()) {
      return 'Ingresá un nombre válido (solo letras y espacios)';
    }
    if (!form.titular_apellido.trim()) {
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

  function addDeporteExtra(deporte: string) {
    const key = deporteKey(deporte);
    setDeportesExtras((prev) =>
      prev.some((d) => deporteKey(d) === key) ? prev : [...prev, deporte.trim()],
    );
  }

  function removeDeporteExtra(deporte: string) {
    const key = deporteKey(deporte);
    setDeportesExtras((prev) => prev.filter((d) => deporteKey(d) !== key));
  }

  function isPredefinedEspacio(esp: EspacioBorrador) {
    return ESPACIO_TIPOS.some((t) => t.value === esp.tipo && t.label === esp.nombre);
  }

  function toggleEspacioTipo(tipo: (typeof ESPACIO_TIPOS)[number]) {
    setEspacios((prev) => {
      const exists = prev.some((e) => e.tipo === tipo.value && e.nombre === tipo.label);
      if (exists) {
        return prev.filter((e) => !(e.tipo === tipo.value && e.nombre === tipo.label));
      }
      return [...prev, { nombre: tipo.label, tipo: tipo.value }];
    });
  }

  function addEspaciosExtra() {
    const names = espacioExtraDraft
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return;
    setEspacios((prev) => {
      const existingKeys = new Set(prev.map((e) => e.nombre.toLowerCase()));
      const additions: EspacioBorrador[] = [];
      for (const nombre of names) {
        const key = nombre.toLowerCase();
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        additions.push({ nombre, tipo: 'otro' });
      }
      return [...prev, ...additions];
    });
    setEspacioExtraDraft('');
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
    const direccionCompleta = direccionTexto.trim();
    const deportes = mergeDeportes(deportesSeleccionados, deportesExtras);

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
          ...(extrasCategoria.some((c) => c.nombre.trim())
            ? {
                categorias: extrasCategoria
                  .filter((c) => c.nombre.trim())
                  .map((c) => ({
                    nombre: c.nombre.trim(),
                    monto: Number(c.monto || 0),
                  })),
              }
            : {}),
          nueva_password: form.nueva_password,
          ubicacion_json: ubicacion || undefined,
          deportes: deportes.length ? deportes : undefined,
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
          className="mt-6 rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white"
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
                  ? 'bg-[var(--primary)] text-white'
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
                  const filtered = filterPersonName(e.target.value);
                  setForm({ ...form, titular_nombre: filtered });
                  setTitularNombreError(e.target.value !== filtered ? NAME_HELP : '');
                }}
                placeholder="Ej: Juan"
                required
                pattern={NAME_PATTERN}
                title={NAME_HELP}
              />
              {titularNombreError && (
                <p className="mt-1 text-xs text-red-600">{titularNombreError}</p>
              )}
            </label>
            <label className="text-sm">
              Apellido del titular
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.titular_apellido}
                onChange={(e) => {
                  const filtered = filterPersonName(e.target.value);
                  setForm({ ...form, titular_apellido: filtered });
                  setTitularApellidoError(e.target.value !== filtered ? NAME_HELP : '');
                }}
                placeholder="Ej: Pérez"
                required
                pattern={NAME_PATTERN}
                title={NAME_HELP}
              />
              {titularApellidoError && (
                <p className="mt-1 text-xs text-red-600">{titularApellidoError}</p>
              )}
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
                type="tel"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.telefono_club}
                onChange={(e) =>
                  setForm({ ...form, telefono_club: filterPhone(e.target.value) })
                }
                placeholder="Ej: 11 2345-6789"
                inputMode="tel"
                pattern={PHONE_PATTERN}
                maxLength={20}
                title="Solo números, espacios, + y -"
              />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <label className="text-sm">
              Cuota Socio pleno ($)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.cuota_monto}
                onChange={(e) => setForm({ ...form, cuota_monto: e.target.value })}
                placeholder="Ej: 5000"
                min={0}
                required
              />
            </label>
            <div />
            <div className="sm:col-span-2 rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium">Tipos de socio y cuotas</p>
              <p className="mt-1 text-xs text-slate-500">
                Socio pleno es el default. Si el club tiene más tipos (deportivo, menor, jubilado),
                agregalos ahora o después desde Cobros.
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="min-w-[10rem] font-medium">Socio pleno</span>
                  <span>${form.cuota_monto || '0'}</span>
                  <span className="text-xs text-slate-500">(por defecto)</span>
                </li>
                {extrasCategoria.map((extra, idx) => (
                  <li
                    key={idx}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      className="min-w-[10rem] flex-1 rounded-lg border px-3 py-2 text-sm"
                      value={extra.nombre}
                      onChange={(e) =>
                        setExtrasCategoria((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, nombre: e.target.value } : row,
                          ),
                        )
                      }
                      placeholder="Ej: Deportivo"
                    />
                    <input
                      type="number"
                      min={0}
                      className="w-28 rounded-lg border px-3 py-2 text-sm"
                      value={extra.monto}
                      onChange={(e) =>
                        setExtrasCategoria((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, monto: e.target.value } : row,
                          ),
                        )
                      }
                      placeholder="$"
                    />
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() =>
                        setExtrasCategoria((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                onClick={() =>
                  setExtrasCategoria((prev) => [...prev, { nombre: '', monto: '' }])
                }
              >
                Agregar tipo de socio
              </button>
            </div>
            <PlaceAutocomplete<GeoRefLocalidad>
              label="Ciudad/Provincia"
              value={ciudadDisplay}
              onChange={(val) => {
                setCiudadDisplay(val);
                setForm((f) => ({ ...f, ciudad: val }));
              }}
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
                  pais: 'Argentina',
                }));
                setCiudadDisplay(
                  `${localidad.nombre}, ${localidad.provincia.nombre}, Argentina`,
                );
                setForm((f) => ({
                  ...f,
                  ciudad: localidad.nombre,
                  provincia: localidad.provincia.nombre,
                  pais: 'Argentina',
                }));
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
              label="Calle y altura"
              value={direccionTexto}
              onChange={setDireccionTexto}
              onSelect={(calle) => {
                const alturaMatch = direccionTexto.match(/(\d+)\s*$/);
                const altura = alturaMatch ? alturaMatch[1] : '';
                setDireccionTexto(`${calle.nombre}${altura ? ' ' + altura : ''}`);
                setUbicacion((prev) => ({
                  ...prev,
                  calle: {
                    id: calle.id,
                    nombre: calle.nombre,
                  },
                }));
              }}
              fetchUrl={(query) => {
                const calleQuery = query.replace(/\d+\s*$/, '').trim();
                const params = new URLSearchParams({
                  nombre: calleQuery,
                  max: '10',
                });
                if (ubicacion?.provincia?.id) {
                  params.append('provincia', ubicacion.provincia.id);
                }
                if (ubicacion?.localidad?.id) {
                  params.append('localidad_censal', ubicacion.localidad.id);
                }
                return `https://apis.datos.gob.ar/georef/api/calles?${params.toString()}`;
              }}
              resultsKey="calles"
              formatOption={(item) => item.nombre}
              placeholder="Ej: Pellegrini 1234"
            />
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
              <DeportesPicker
                seleccionados={deportesSeleccionados}
                extras={deportesExtras}
                onToggle={toggleDeporte}
                onAddExtra={addDeporteExtra}
                onRemoveExtra={removeDeporteExtra}
                hint="Podés agregar o sacar deportes después en Configuración."
              />
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium">Espacios para reserva (opcional)</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ESPACIO_TIPOS.map((tipo) => (
                  <label key={tipo.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={espacios.some(
                        (e) => e.tipo === tipo.value && e.nombre === tipo.label,
                      )}
                      onChange={() => toggleEspacioTipo(tipo)}
                    />
                    {tipo.label}
                  </label>
                ))}
              </div>

              <div className="mt-3">
                <p className="text-sm">Otro espacio</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input
                    className="min-w-[12rem] flex-1 rounded-lg border px-3 py-2 text-sm"
                    value={espacioExtraDraft}
                    onChange={(e) => setEspacioExtraDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEspaciosExtra();
                      }
                    }}
                    placeholder="Ej: Cancha 1, Cancha 2"
                  />
                  <button
                    type="button"
                    onClick={addEspaciosExtra}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    Agregar
                  </button>
                </div>
                {espacios.some((e) => !isPredefinedEspacio(e)) && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {espacios.map((esp, idx) =>
                      isPredefinedEspacio(esp) ? null : (
                        <li
                          key={`${esp.nombre}-${idx}`}
                          className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
                        >
                          {esp.nombre}
                          <button
                            type="button"
                            onClick={() => removeEspacio(idx)}
                            className="text-xs text-red-600"
                          >
                            Quitar
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
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
          <div className="sm:col-span-2 space-y-4">
            <p className="text-sm text-slate-600">
              Revisá los datos antes de finalizar. Podés volver atrás para
              corregir cualquier paso.
            </p>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-700">Titular</p>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-slate-500">Nombre</dt>
                <dd>{form.titular_nombre} {form.titular_apellido}</dd>
                <dt className="text-slate-500">CUIT/CUIL</dt>
                <dd>{form.cuit_cuil || '—'}</dd>
                <dt className="text-slate-500">Teléfono</dt>
                <dd>{form.telefono_club || '—'}</dd>
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-700">Club</p>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-slate-500">Cuota Socio pleno</dt>
                <dd>${form.cuota_monto || '—'}</dd>
                <dt className="text-slate-500">Ciudad</dt>
                <dd>{ciudadDisplay || '—'}</dd>
                <dt className="text-slate-500">Dirección</dt>
                <dd>
                  {direccionTexto.trim() || '—'}
                </dd>
                {extrasCategoria.filter((c) => c.nombre.trim()).length > 0 && (
                  <>
                    <dt className="text-slate-500">Otras categorías</dt>
                    <dd>
                      {extrasCategoria
                        .filter((c) => c.nombre.trim())
                        .map((c) => `${c.nombre} ($${c.monto || 0})`)
                        .join(', ')}
                    </dd>
                  </>
                )}
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-700">Deportes y espacios</p>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-slate-500">Deportes</dt>
                <dd>
                  {mergeDeportes(deportesSeleccionados, deportesExtras).join(', ') || '—'}
                </dd>
                <dt className="text-slate-500">Espacios</dt>
                <dd>{espacios.length ? `${espacios.length} cargado(s)` : '—'}</dd>
              </dl>
            </div>

            {session && (
              <VerificarTarjetaCard
                token={session.access_token}
                clubSlug={session.club.slug}
                email={session.admin.email}
                verified={tarjetaVerificada}
                onVerified={() => setTarjetaVerificada(true)}
                portalTarget={tarjetaPortal}
              />
            )}
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
              className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Confirmar y finalizar'}
            </button>
          )}
        </div>
      </form>

      {/* Fuera del <form> del wizard: acá se porta el <form> de MercadoPago
          (no se puede anidar un <form> dentro de otro). */}
      {step === 5 && <div ref={setTarjetaPortal} />}
    </div>
  );
}
