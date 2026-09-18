import { parseTenantHost } from './tenant-host';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const PLAN_UPGRADE_REQUIRED = 'PLAN_UPGRADE_REQUIRED';

export type PlanUpgradeBody = {
  code: typeof PLAN_UPGRADE_REQUIRED;
  message?: string;
  socios_actuales: number;
  extras?: number;
  plan_hasta: number;
  plan_nombre: string;
  precio_actual: number;
  precio_proximo: number;
  hasta_proximo: number | null;
  plan_proximo_nombre: string;
  aplica_desde: string;
};

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(message: string, status: number, body: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function isPlanUpgradeRequired(err: unknown): err is ApiError {
  return (
    err instanceof ApiError &&
    err.status === 409 &&
    err.body.code === PLAN_UPGRADE_REQUIRED
  );
}

function clubSlugFromBrowser(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.host;
  const base =
    process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ||
    (window.location.hostname === 'localhost' ||
    window.location.hostname.endsWith('.localhost')
      ? 'localhost'
      : undefined);
  return parseTenantHost(host, base).slug ?? undefined;
}

export type ClubColors = {
  color_primario: string;
  color_secundario?: string | null;
  color_terciario?: string | null;
};

export type CuentaOption = {
  membresia_id: number;
  rol: string;
  es_socio: boolean;
  club: {
    id: number;
    slug: string;
    nombre: string;
    logo_url: string | null;
  };
};

export type ClubSession = {
  access_token: string;
  expires_in?: number;
  expires_at?: number;
  role?: string;
  cuentas?: CuentaOption[];
  must_complete_onboarding?: boolean;
  must_change_password?: boolean;
  impersonated_by_platform?: boolean;
  admin: { id: number; email: string; nombre: string; rol: string };
  club: {
    id: number;
    slug: string;
    nombre: string;
    color_primario: string;
    color_secundario?: string | null;
    color_terciario?: string | null;
    logo_url: string | null;
    cuota_monto: number;
    onboarding_completo?: boolean;
    deportes?: string[];
    descuento_familiar_pct?: number;
    bloquear_entrada?: boolean;
  };
};

export type PlatformSession = {
  access_token: string;
  expires_in?: number;
  expires_at?: number;
  platform_admin: { id: number; email: string; nombre: string };
};

export type ClubLoginBranding = {
  id: number;
  slug: string;
  nombre: string;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string | null;
  color_terciario: string | null;
  activo: boolean;
};

export type SocioSession = {
  access_token: string;
  expires_in?: number;
  expires_at?: number;
  role?: string;
  es_socio: boolean;
  cuentas?: CuentaOption[];
  must_change_password?: boolean;
  socio: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    estado: string;
    rol: string;
    es_socio: boolean;
  };
  club: {
    id: number;
    slug: string;
    nombre: string;
    color_primario: string;
    color_secundario?: string | null;
    color_terciario?: string | null;
    logo_url: string | null;
    cuota_monto: number;
  };
};

export type LoginResult = {
  access_token: string;
  expires_in?: number;
  role: string;
  es_socio: boolean;
  cuentas?: CuentaOption[];
  must_complete_onboarding?: boolean;
  must_change_password?: boolean;
  impersonated_by_platform?: boolean;
  admin?: ClubSession['admin'];
  socio?: SocioSession['socio'];
  club: ClubSession['club'];
};

export function isStaffRole(role: string | undefined) {
  return role === 'admin' || role === 'entrada';
}

export type SocioClubOption = {
  id: number;
  slug: string;
  nombre: string;
  logo_url: string | null;
};

export type SocioLoginResponse =
  | SocioSession
  | { needs_club_choice: true; clubs: SocioClubOption[] };

export function isSocioSession(
  data: SocioLoginResponse,
): data is SocioSession {
  return 'access_token' in data;
}

const SESSION_KEY = 'clubapp_session';
const PLATFORM_SESSION_KEY = 'clubapp_platform_session';
const SOCIO_SESSION_KEY = 'clubapp_socio_session';

function notifySessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('club-session-changed'));
  }
}

export function resolveClubTheme(colors: ClubColors): {
  primary: string;
  secondary: string;
  tertiary: string;
} {
  const primary = colors.color_primario || '#2563eb';
  const secondary = colors.color_secundario || primary;
  const tertiary = colors.color_terciario || primary;
  return { primary, secondary, tertiary };
}

/**
 * Fondo del club: gradiente que arranca en el primario. Si hay terciario,
 * pasa por el secundario (si lo hay) y termina en el terciario. Si no hay
 * terciario, termina en el secundario (si lo hay), y si no hay ninguno de
 * los dos, termina en blanco/negro según el tema del sistema.
 */
export function resolveClubGradient(
  colors: ClubColors,
  prefersDark = false,
  reversed = false,
): string {
  const primary = colors.color_primario || '#2563eb';

  let stops: string[];
  if (colors.color_terciario) {
    stops = colors.color_secundario
      ? [primary, colors.color_secundario, colors.color_terciario]
      : [primary, colors.color_terciario];
  } else {
    const end = colors.color_secundario || (prefersDark ? '#000000' : '#ffffff');
    stops = [primary, end];
  }

  if (reversed) stops = [...stops].reverse();
  return `linear-gradient(135deg, ${stops.join(', ')})`;
}

export function applyClubTheme(colors: ClubColors) {
  if (typeof document === 'undefined') return;
  const { primary, secondary, tertiary } = resolveClubTheme(colors);
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const root = document.documentElement;
  root.style.setProperty('--club-primary', primary);
  root.style.setProperty('--club-secondary', secondary);
  root.style.setProperty('--club-tertiary', tertiary);
  root.style.setProperty('--club-bg-gradient', resolveClubGradient(colors, prefersDark));
  root.style.setProperty(
    '--club-bg-gradient-inverted',
    resolveClubGradient(colors, prefersDark, true),
  );
}

export function saveSession(session: ClubSession) {
  if (typeof window === 'undefined') return;
  const persisted = session.expires_in && !session.expires_at
    ? { ...session, expires_at: Date.now() + session.expires_in * 1000 }
    : session;
  localStorage.setItem(SESSION_KEY, JSON.stringify(persisted));
  notifySessionChanged();
}

export function getSession(): ClubSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as ClubSession;
    if (session.expires_at && session.expires_at <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  notifySessionChanged();
}

/** Sesión de staff, redirigiendo a /login si no existe (evita quedar trabado en "Cargando…"). */
export function requireSession(): ClubSession | null {
  const session = getSession();
  if (!session && typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  return session;
}

export function savePlatformSession(session: PlatformSession) {
  if (typeof window === 'undefined') return;
  const persisted = session.expires_in && !session.expires_at
    ? { ...session, expires_at: Date.now() + session.expires_in * 1000 }
    : session;
  localStorage.setItem(PLATFORM_SESSION_KEY, JSON.stringify(persisted));
  notifySessionChanged();
}

export function getPlatformSession(): PlatformSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PLATFORM_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as PlatformSession;
    if (session.expires_at && session.expires_at <= Date.now()) {
      localStorage.removeItem(PLATFORM_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(PLATFORM_SESSION_KEY);
    return null;
  }
}

export function clearPlatformSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLATFORM_SESSION_KEY);
  notifySessionChanged();
}

export function saveSocioSession(session: SocioSession) {
  if (typeof window === 'undefined') return;
  const persisted = session.expires_in && !session.expires_at
    ? { ...session, expires_at: Date.now() + session.expires_in * 1000 }
    : session;
  localStorage.setItem(SOCIO_SESSION_KEY, JSON.stringify(persisted));
  notifySessionChanged();
}

export function getSocioSession(): SocioSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SOCIO_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as SocioSession;
    if (session.expires_at && session.expires_at <= Date.now()) {
      localStorage.removeItem(SOCIO_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SOCIO_SESSION_KEY);
    return null;
  }
}

export function requireSocioSession(): SocioSession | null {
  const session = getSocioSession();
  if (!session && typeof window !== 'undefined') window.location.href = '/login';
  return session;
}

export function clearSocioSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SOCIO_SESSION_KEY);
  notifySessionChanged();
}

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function throwApiError(res: Response, data: Record<string, unknown>) {
  const raw = data.message;
  const msg = Array.isArray(raw)
    ? raw.join(', ')
    : typeof raw === 'string'
      ? raw
      : `Error ${res.status}`;
  throw new ApiError(msg, res.status, data);
}

export async function apiUpload<T>(
  path: string,
  file: File,
  options: {
    token?: string;
    clubSlug?: string;
    fieldName?: string;
    fields?: Record<string, string>;
  } = {},
): Promise<T> {
  const body = new FormData();
  body.append(options.fieldName || 'file', file);
  if (options.fields) {
    for (const [key, value] of Object.entries(options.fields)) {
      body.append(key, value);
    }
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body,
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...((options.clubSlug || clubSlugFromBrowser())
        ? { 'X-Club-Slug': options.clubSlug || clubSlugFromBrowser()! }
        : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      handleExpiredSession(options.token);
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throwApiError(res, data);
  }
  return res.json() as Promise<T>;
}

function loginPathFor(kind: 'admin' | 'socio' | 'platform'): string {
  if (kind === 'platform') return '/supercalifragilisticoespiralidoso/acceso';
  return '/login';
}

/** Sesión vencida o revocada (401 en un request autenticado): la limpia y manda al login del canal. */
function handleExpiredSession(token: string | undefined) {
  if (typeof window === 'undefined' || !token) return;
  let kind: 'admin' | 'socio' | 'platform' | null = null;
  if (getSession()?.access_token === token) {
    clearSession();
    kind = 'admin';
  } else if (getSocioSession()?.access_token === token) {
    clearSocioSession();
    kind = 'socio';
  } else if (getPlatformSession()?.access_token === token) {
    clearPlatformSession();
    kind = 'platform';
  }
  if (!kind) return;
  const path = loginPathFor(kind);
  if (window.location.pathname !== path) {
    window.location.href = path;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; clubSlug?: string } = {},
): Promise<T> {
  const { token, clubSlug, headers, ...rest } = options;
  const slug = clubSlug || clubSlugFromBrowser();
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(slug ? { 'X-Club-Slug': slug } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      handleExpiredSession(token);
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throwApiError(res, data);
  }
  return res.json() as Promise<T>;
}

export async function apiDownload(
  path: string,
  filename: string,
  options: { token?: string; clubSlug?: string } = {},
) {
  const slug = options.clubSlug || clubSlugFromBrowser();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(slug ? { 'X-Club-Slug': slug } : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      handleExpiredSession(options.token);
    }
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type NotificacionItem = {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
};

export function listNotificaciones(token: string, clubSlug?: string) {
  return apiFetch<NotificacionItem[]>('/notificaciones', { token, clubSlug });
}

export function marcarNotificacionLeida(id: number, token: string, clubSlug?: string) {
  return apiFetch<{ ok: boolean }>(`/notificaciones/${id}/leido`, {
    method: 'PATCH',
    token,
    clubSlug,
  });
}

export function marcarTodasNotificacionesLeidas(token: string, clubSlug?: string) {
  return apiFetch<{ ok: boolean }>('/notificaciones/marcar-todas-leidas', {
    method: 'PATCH',
    token,
    clubSlug,
  });
}

export { API_URL };
