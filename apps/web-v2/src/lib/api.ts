import { parseTenantHost } from './tenant-host';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  club: {
    id: number;
    slug: string;
    nombre: string;
    logo_url: string | null;
  };
};

export type ClubSession = {
  access_token: string;
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
  };
};

export type PlatformSession = {
  access_token: string;
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
  role?: string;
  cuentas?: CuentaOption[];
  socio: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    estado: string;
    rol: string;
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
  role: string;
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

export function applyClubTheme(colors: ClubColors) {
  if (typeof document === 'undefined') return;
  const { primary, secondary, tertiary } = resolveClubTheme(colors);
  const root = document.documentElement;
  root.style.setProperty('--club-primary', primary);
  root.style.setProperty('--club-secondary', secondary);
  root.style.setProperty('--club-tertiary', tertiary);
}

export function saveSession(session: ClubSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): ClubSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClubSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function savePlatformSession(session: PlatformSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLATFORM_SESSION_KEY, JSON.stringify(session));
}

export function getPlatformSession(): PlatformSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PLATFORM_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformSession;
  } catch {
    return null;
  }
}

export function clearPlatformSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLATFORM_SESSION_KEY);
}

export function saveSocioSession(session: SocioSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOCIO_SESSION_KEY, JSON.stringify(session));
}

export function getSocioSession(): SocioSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SOCIO_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SocioSession;
  } catch {
    return null;
  }
}

export function clearSocioSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SOCIO_SESSION_KEY);
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

export async function apiUpload<T>(
  path: string,
  file: File,
  options: { token?: string; clubSlug?: string; fieldName?: string } = {},
): Promise<T> {
  const body = new FormData();
  body.append(options.fieldName || 'file', file);
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
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
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
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export { API_URL };
