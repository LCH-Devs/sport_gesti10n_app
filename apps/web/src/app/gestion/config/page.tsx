'use client';

import {
  apiFetch,
  applyClubTheme,
  getSession,
  getSocioSession,
  requireSession,
  saveSession,
  saveSocioSession,
} from '@/lib/api';
import { ClubColorFields } from '@/components/ClubColorFields';
import { ClubLogoField } from '@/components/ClubLogoField';
import { useLanguageContext } from '@/lib/LanguageContext';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'perfil' | 'club' | 'preferencias';

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

type ClubConfig = {
  id: number;
  slug: string;
  nombre: string;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string | null;
  color_terciario: string | null;
  cuota_monto: number;
  regla_moroso_cuotas: number;
  bloquear_reservas: boolean;
  bloquear_entrada: boolean;
  cumples_auto: boolean;
  max_reservas_activas: number;
  cancelar_reserva_horas: number;
};

const NOTIF_KEY = 'clubapp_notif_prefs';

type NotifPrefs = {
  email: boolean;
  app: boolean;
};

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === 'undefined') return { email: true, app: true };
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) return { email: true, app: true };
    return JSON.parse(raw) as NotifPrefs;
  } catch {
    return { email: true, app: true };
  }
}

function PerfilSection() {
  type Mode = 'staff' | 'member';
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
    return error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : (
      <p className="text-slate-500">Cargando…</p>
    );
  }

  const email = mode === 'staff' ? staffProfile?.email : memberProfile?.email;

  return (
    <div>
      <h3 className="text-lg font-semibold">Perfil</h3>
      <p className="mt-1 text-sm text-slate-600">Tus datos personales y contraseña.</p>
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

function ClubSection() {
  const [form, setForm] = useState<ClubConfig | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<ClubConfig>('/clubs/me', {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      setForm(data);
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
    const session = requireSession();
    if (!session || !form) return;
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const updated = await apiFetch<ClubConfig>('/clubs/me', {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({
          nombre: form.nombre,
          logo_url: form.logo_url || '',
          color_primario: form.color_primario,
          color_secundario: form.color_secundario || null,
          color_terciario: form.color_terciario || null,
          cuota_monto: Number(form.cuota_monto),
          regla_moroso_cuotas: Number(form.regla_moroso_cuotas),
          bloquear_reservas: form.bloquear_reservas,
          bloquear_entrada: form.bloquear_entrada,
          cumples_auto: form.cumples_auto,
          max_reservas_activas: Number(form.max_reservas_activas),
          cancelar_reserva_horas: Number(form.cancelar_reserva_horas),
        }),
      });
      setForm(updated);
      applyClubTheme(updated);
      saveSession({
        ...session,
        club: {
          ...session.club,
          nombre: updated.nombre,
          color_primario: updated.color_primario,
          color_secundario: updated.color_secundario,
          color_terciario: updated.color_terciario,
          logo_url: updated.logo_url,
          cuota_monto: updated.cuota_monto,
        },
      });
      setMsg('Configuración guardada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : (
      <p className="text-slate-500">Cargando…</p>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Club</h3>
      <p className="mt-1 text-sm text-slate-600">
        Datos y reglas del club (solo tu tenant).
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}

      <form
        onSubmit={onSave}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Nombre
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => f && { ...f, nombre: e.target.value })}
            required
          />
        </label>
        <ClubColorFields
          primario={form.color_primario}
          secundario={form.color_secundario}
          terciario={form.color_terciario}
          livePreview
          onChange={(next) =>
            setForm((f) =>
              f
                ? {
                    ...f,
                    color_primario: next.color_primario,
                    color_secundario: next.color_secundario,
                    color_terciario: next.color_terciario,
                  }
                : f,
            )
          }
        />
        <ClubLogoField
          value={form.logo_url || ''}
          onChange={(logo_url) => setForm((f) => f && { ...f, logo_url })}
          onError={setError}
        />
        <label className="text-sm">
          Cuota monto
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.cuota_monto}
            onChange={(e) =>
              setForm((f) => f && { ...f, cuota_monto: Number(e.target.value) })
            }
            required
          />
        </label>
        <label className="text-sm">
          Regla moroso (cuotas)
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.regla_moroso_cuotas}
            onChange={(e) =>
              setForm(
                (f) =>
                  f && { ...f, regla_moroso_cuotas: Number(e.target.value) },
              )
            }
            required
          />
        </label>
        <label className="text-sm">
          Máx. reservas activas
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.max_reservas_activas}
            onChange={(e) =>
              setForm(
                (f) =>
                  f && { ...f, max_reservas_activas: Number(e.target.value) },
              )
            }
            required
          />
        </label>
        <label className="text-sm">
          Cancelar reserva (horas)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.cancelar_reserva_horas}
            onChange={(e) =>
              setForm(
                (f) =>
                  f && {
                    ...f,
                    cancelar_reserva_horas: Number(e.target.value),
                  },
              )
            }
            required
          />
        </label>

        {(
          [
            ['bloquear_reservas', 'Bloquear reservas si debe'],
            ['bloquear_entrada', 'Bloquear entrada si debe'],
            ['cumples_auto', 'Cumpleaños automáticos'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) =>
                setForm((f) => f && { ...f, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}

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

function PreferenciasSection() {
  const router = useRouter();
  const { lang, setLanguage, mounted } = useLanguageContext();
  const [allowed, setAllowed] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    email: true,
    app: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!getSession() && !getSocioSession()) {
      router.replace('/login');
      return;
    }
    setAllowed(true);
    setNotifPrefs(loadNotifPrefs());
  }, [router]);

  function updateNotif(key: keyof NotifPrefs, value: boolean) {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!allowed) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold">Preferencias</h3>
      <p className="mt-1 text-sm text-slate-600">
        Idioma y notificaciones de tu cuenta.
      </p>
      {saved && <p className="mt-4 text-sm text-green-700">Preferencias guardadas.</p>}

      <div className="mt-6 grid gap-6 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-slate-700">Idioma</p>
          <div className="mt-2 flex gap-2">
            {(['es', 'en'] as const).map((option) => (
              <button
                key={option}
                type="button"
                disabled={!mounted}
                onClick={() => setLanguage(option)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  lang === option
                    ? 'border-[var(--club-primary)] bg-[var(--club-primary)] text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Notificaciones</p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifPrefs.email}
              onChange={(e) => updateNotif('email', e.target.checked)}
            />
            Recibir notificaciones por email
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifPrefs.app}
              onChange={(e) => updateNotif('app', e.target.checked)}
            />
            Recibir notificaciones en la app
          </label>
        </div>
      </div>
    </div>
  );
}

function ConfigContent() {
  const searchParams = useSearchParams();
  const isStaff = Boolean(getSession());
  const initialTab = (searchParams.get('tab') as Tab | null) || (isStaff ? 'club' : 'perfil');
  const [tab, setTab] = useState<Tab>(initialTab);

  const categories: { key: Tab; label: string }[] = [
    ...(isStaff ? [{ key: 'club' as Tab, label: 'Club' }] : []),
    { key: 'perfil', label: 'Perfil' },
    { key: 'preferencias', label: 'Preferencias' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Configuración</h2>
      <p className="mt-1 text-sm text-slate-600">
        Todas las opciones de tu cuenta y del club en un solo lugar.
      </p>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-48 sm:flex-col sm:gap-0.5 sm:overflow-visible">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setTab(c.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                tab === c.key
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === 'club' && isStaff && <ClubSection />}
          {tab === 'perfil' && <PerfilSection />}
          {tab === 'preferencias' && <PreferenciasSection />}
        </div>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  return (
    <Suspense fallback={null}>
      <ConfigContent />
    </Suspense>
  );
}
