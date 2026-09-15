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
import { DeportesPicker } from '@/components/DeportesPicker';
import {
  deporteKey,
  mergeDeportes,
  splitDeportes,
} from '@/lib/deportes-catalogo';
import { useLanguageContext } from '@/lib/LanguageContext';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import type { TimeFormat } from '@/lib/datetime';
import { NAME_HELP, NAME_PATTERN, PHONE_PATTERN, filterPersonName, filterPhone } from '@/lib/validation';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';

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
  deportes?: string[];
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
  const { t } = useTranslation();
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
  const [nombreError, setNombreError] = useState('');
  const [apellidoError, setApellidoError] = useState('');

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
        setError(err instanceof Error ? err.message : t('config.errorCargar'));
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
        setError(err instanceof Error ? err.message : t('config.errorCargar'));
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
      setError(t('config.passwordNoCoincide'));
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
      setMsg(t('config.perfilActualizado'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('config.errorGuardar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !mode) {
    return error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : (
      <p className="text-slate-500">{t('common.loading')}</p>
    );
  }

  const email = mode === 'staff' ? staffProfile?.email : memberProfile?.email;

  return (
    <div>
      <h3 className="text-lg font-semibold">{t('config.perfilTitle')}</h3>
      <p className="mt-1 text-sm text-slate-600">{t('config.perfilSubtitle')}</p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}

      <form
        onSubmit={onSave}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          {t('config.email')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
            value={email || ''}
            disabled
          />
        </label>
        {mode === 'staff' ? (
          <label className="text-sm">
            {t('config.rol')}
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
              value={staffProfile?.rol === 'admin' ? t('config.administrador') : t('config.entrada')}
              disabled
            />
          </label>
        ) : (
          <label className="text-sm">
            {t('config.telefono')}
            <input
              type="tel"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={telefono}
              onChange={(e) => setTelefono(filterPhone(e.target.value))}
              inputMode="tel"
              pattern={PHONE_PATTERN}
              maxLength={20}
              title="Solo números, espacios, + y -"
            />
          </label>
        )}
        <label className="text-sm sm:col-span-2">
          {t('config.nombre')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={nombre}
            onChange={(e) => {
              const filtered = filterPersonName(e.target.value);
              setNombre(filtered);
              setNombreError(e.target.value !== filtered ? NAME_HELP : '');
            }}
            required
            pattern={NAME_PATTERN}
            title={NAME_HELP}
          />
          {nombreError && <p className="mt-1 text-xs text-red-600">{nombreError}</p>}
        </label>
        {mode === 'member' && (
          <label className="text-sm sm:col-span-2">
            {t('config.apellido')}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={apellido}
              onChange={(e) => {
                const filtered = filterPersonName(e.target.value);
                setApellido(filtered);
                setApellidoError(e.target.value !== filtered ? NAME_HELP : '');
              }}
              required
              pattern={NAME_PATTERN}
              title={NAME_HELP}
            />
            {apellidoError && <p className="mt-1 text-xs text-red-600">{apellidoError}</p>}
          </label>
        )}

        <hr className="sm:col-span-2 my-2 border-slate-200" />
        <p className="sm:col-span-2 text-sm font-medium text-slate-700">
          {t('config.cambiarPasswordTitle')}
        </p>

        <label className="text-sm">
          {t('config.currentPassword')}
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <div />
        <label className="text-sm">
          {t('config.newPassword')}
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={4}
          />
        </label>
        <label className="text-sm">
          {t('config.confirmPassword')}
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
          className="sm:col-span-2 rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? t('config.guardando') : t('config.guardar')}
        </button>
      </form>
    </div>
  );
}

function ClubSection() {
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('config.errorCargar'));
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
          deportes: form.deportes ?? [],
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
          deportes: updated.deportes,
        },
      });
      setMsg(t('config.clubGuardado'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('config.errorGuardar'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : (
      <p className="text-slate-500">{t('common.loading')}</p>
    );
  }

  const deportesSplit = splitDeportes(form.deportes || []);

  return (
    <div>
      <h3 className="text-lg font-semibold">{t('config.clubTitle')}</h3>
      <p className="mt-1 text-sm text-slate-600">{t('config.clubSubtitle')}</p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}

      <form
        onSubmit={onSave}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          {t('config.nombre')}
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm((f) => f && { ...f, nombre: e.target.value })}
            required
            maxLength={80}
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
        <div className="sm:col-span-2">
          <DeportesPicker
            seleccionados={deportesSplit.catalogo}
            extras={deportesSplit.extras}
            onToggle={(deporte) =>
              setForm((f) => {
                if (!f) return f;
                const actual = splitDeportes(f.deportes || []);
                const catalogo = actual.catalogo.includes(deporte)
                  ? actual.catalogo.filter((d) => d !== deporte)
                  : [...actual.catalogo, deporte];
                return { ...f, deportes: mergeDeportes(catalogo, actual.extras) };
              })
            }
            onAddExtra={(deporte) =>
              setForm((f) => {
                if (!f) return f;
                const actual = splitDeportes(f.deportes || []);
                const key = deporteKey(deporte);
                if (actual.extras.some((d) => deporteKey(d) === key)) return f;
                return {
                  ...f,
                  deportes: mergeDeportes(actual.catalogo, [...actual.extras, deporte]),
                };
              })
            }
            onRemoveExtra={(deporte) =>
              setForm((f) => {
                if (!f) return f;
                const actual = splitDeportes(f.deportes || []);
                const key = deporteKey(deporte);
                return {
                  ...f,
                  deportes: mergeDeportes(
                    actual.catalogo,
                    actual.extras.filter((d) => deporteKey(d) !== key),
                  ),
                };
              })
            }
            hint={t('config.espaciosHint')}
          />
        </div>
        <label className="text-sm">
          {t('config.cuotaMonto')}
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
          {t('config.reglaMoroso')}
          <input
            type="number"
            min={1}
            max={24}
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
          {t('config.maxReservas')}
          <input
            type="number"
            min={1}
            max={100}
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
          {t('config.cancelarReservaHoras')}
          <input
            type="number"
            min={0}
            max={168}
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
            ['bloquear_reservas', t('config.bloquearReservas')],
            ['bloquear_entrada', t('config.bloquearEntrada')],
            ['cumples_auto', t('config.cumplesAuto')],
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
          className="sm:col-span-2 rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? t('config.guardando') : t('config.guardar')}
        </button>
      </form>
    </div>
  );
}

function PreferenciasSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { lang, setLanguage, mounted } = useLanguageContext();
  const { timeFormat, setTimeFormat } = useDateTimeFormat();
  const [allowed, setAllowed] = useState(false);
  const [draftLang, setDraftLang] = useState<'es' | 'en'>('es');
  const [draftTimeFormat, setDraftTimeFormat] = useState<TimeFormat>('24h');
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    email: true,
    app: true,
  });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!getSession() && !getSocioSession()) {
      router.replace('/login');
      return;
    }
    setAllowed(true);
    setNotifPrefs(loadNotifPrefs());
  }, [router]);

  useEffect(() => {
    setDraftLang(lang);
  }, [lang]);

  useEffect(() => {
    setDraftTimeFormat(timeFormat);
  }, [timeFormat]);

  function updateDraftLang(option: 'es' | 'en') {
    setDraftLang(option);
    setDirty(true);
    setSaved(false);
  }

  function updateDraftTimeFormat(fmt: TimeFormat) {
    setDraftTimeFormat(fmt);
    setDirty(true);
    setSaved(false);
  }

  function updateNotif(key: keyof NotifPrefs, value: boolean) {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function onGuardar() {
    setLanguage(draftLang);
    setTimeFormat(draftTimeFormat);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifPrefs));
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!allowed) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold">{t('config.preferenciasTitle')}</h3>
      <p className="mt-1 text-sm text-slate-600">{t('config.preferenciasSubtitle')}</p>
      {saved && <p className="mt-4 text-sm text-green-700">{t('config.preferenciasGuardadas')}</p>}

      <div className="mt-6 grid gap-6 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-slate-700">{t('config.idioma')}</p>
          <div className="mt-2 flex gap-2">
            {(['es', 'en'] as const).map((option) => (
              <button
                key={option}
                type="button"
                disabled={!mounted}
                onClick={() => updateDraftLang(option)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  draftLang === option
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">{t('config.formatoHora')}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t('config.formatoHoraHint')}</p>
          <div className="mt-2 flex gap-2">
            {(['24h', '12h'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateDraftTimeFormat(option)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  draftTimeFormat === option
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option === '24h' ? t('config.formato24h') : t('config.formato12h')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">{t('config.notificaciones')}</p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifPrefs.email}
              onChange={(e) => updateNotif('email', e.target.checked)}
            />
            {t('config.notifEmail')}
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifPrefs.app}
              onChange={(e) => updateNotif('app', e.target.checked)}
            />
            {t('config.notifApp')}
          </label>
        </div>

        <button
          type="button"
          onClick={onGuardar}
          disabled={!dirty}
          className="justify-self-start rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {t('config.guardarCambios')}
        </button>
      </div>
    </div>
  );
}

function ConfigContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const isStaff = Boolean(getSession());
  const initialTab = (searchParams.get('tab') as Tab | null) || (isStaff ? 'club' : 'perfil');
  const [tab, setTab] = useState<Tab>(initialTab);

  const categories: { key: Tab; label: string }[] = [
    ...(isStaff ? [{ key: 'club' as Tab, label: t('config.tabClub') }] : []),
    { key: 'perfil', label: t('config.tabPerfil') },
    { key: 'preferencias', label: t('config.tabPreferencias') },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">{t('config.title')}</h2>
      <p className="mt-1 text-sm text-slate-600">{t('config.subtitle')}</p>

      <div className="mt-6">
        <nav className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setTab(c.key)}
              className={`whitespace-nowrap rounded-t-lg border-x border-t px-4 py-2 text-sm font-medium transition-colors ${
                tab === c.key
                  ? 'border-slate-200 bg-white text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <div className="-mt-px min-w-0 rounded-b-lg rounded-tr-lg border border-slate-200 bg-white p-4 sm:p-6">
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
