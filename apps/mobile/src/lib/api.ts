const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export type CuentaOption = {
  membresia_id: number;
  rol: string;
  club: { id: number; slug: string; nombre: string; logo_url: string | null };
};

export type SocioInfo = { id: number; email: string; nombre: string; apellido: string; dni: string; estado: string; rol: string };
export type AdminInfo = { id: number; email: string; nombre: string; rol: string };
export type ClubInfo = {
  id: number;
  slug: string;
  nombre: string;
  color_primario: string;
  color_secundario: string | null;
  color_terciario: string | null;
  logo_url: string | null;
  cuota_monto: number;
  onboarding_completo: boolean;
};

export type LoginResponse = {
  access_token: string;
  expires_in?: number;
  role: string;
  cuentas: CuentaOption[];
  must_complete_onboarding: boolean;
  must_change_password: boolean;
  impersonated_by_platform: boolean;
  socio?: SocioInfo;
  admin?: AdminInfo;
  club: ClubInfo;
};

export function isStaffRole(role: string | undefined) {
  return role === 'admin' || role === 'entrada';
}

export class UnauthorizedError extends Error {}

let onUnauthorized: (() => void) | null = null;

/** Registra un callback global que se dispara cuando la API devuelve 401 (sesión vencida/inválida). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    if (response.status === 401) {
      onUnauthorized?.();
      throw new UnauthorizedError(message || 'Tu sesión venció, ingresá de nuevo');
    }
    throw new Error(message || 'No se pudo conectar con el servidor');
  }
  return body as T;
}

/** Login unificado: el backend resuelve si es socio o staff según las credenciales, igual que en web. */
export function login(email: string, password: string, clubSlug?: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(clubSlug ? { club_slug: clubSlug } : {}) }),
  });
}

export function switchCuenta(token: string, membresiaId: number) {
  return apiFetch<LoginResponse>('/auth/switch', {
    method: 'POST',
    body: JSON.stringify({ membresia_id: membresiaId }),
  }, token);
}

export type Pago = {
  id: number;
  mes: string;
  monto: number;
  estado: string;
  fecha_pago: string | null;
  tipo: string;
  concepto: string | null;
};

export type Noticia = {
  id: number;
  titulo: string;
  cuerpo: string;
  fecha: string;
  es_evento: boolean;
  imagen_url: string | null;
};

export type ActividadResumen = { id: number; nombre: string };

export type PortalMe = {
  socio: SocioInfo & { telefono?: string; fecha_nacimiento?: string | null };
  club: { id: number; nombre: string };
  pagos: Pago[];
  noticias: Noticia[];
  actividades: ActividadResumen[];
};

export function getPortalMe(token: string) {
  return apiFetch<PortalMe>('/socio/me', {}, token);
}

export type Espacio = {
  id: number;
  nombre: string;
  tipo: string;
  duracion_slot_min: number;
  hora_apertura: string;
  hora_cierre: string;
};

export type Reserva = {
  id: number;
  espacio_id: number;
  espacio: { id: number; nombre: string; tipo: string };
  inicio: string;
  fin: string;
  estado: string;
  nota: string | null;
};

export type Slot = { inicio: string; fin: string; libre: boolean };

export function listEspaciosSocio(token: string) {
  return apiFetch<Espacio[]>('/socio/espacios', {}, token);
}

export function getDisponibilidad(token: string, espacioId: number, fecha: string) {
  return apiFetch<{ slots: Slot[] }>(`/socio/espacios/${espacioId}/disponibilidad?fecha=${fecha}`, {}, token);
}

export function listReservasSocio(token: string) {
  return apiFetch<Reserva[]>('/socio/reservas', {}, token);
}

export function crearReservaSocio(token: string, espacioId: number, inicio: string, fin: string) {
  return apiFetch<Reserva>('/socio/reservas', {
    method: 'POST',
    body: JSON.stringify({ espacio_id: espacioId, inicio, fin }),
  }, token);
}

export function cancelarReservaSocio(token: string, reservaId: number) {
  return apiFetch<Reserva>(`/socio/reservas/${reservaId}/cancelar`, { method: 'PATCH' }, token);
}

export type EventoTipo = 'seminario' | 'torneo' | 'social';

export type EventoPublico = {
  id: number;
  titulo: string;
  tipo: EventoTipo;
  visibilidad: 'publico' | 'privado';
  fecha: string;
  lugar: string | null;
  descripcion: string | null;
  club: { id: number; nombre: string; slug: string; logo_url: string | null };
};

export function listEventosPublicos(token: string) {
  return apiFetch<EventoPublico[]>('/eventos-publicos', {}, token);
}

export function changePassword(
  token: string,
  role: string,
  currentPassword: string,
  newPassword: string,
) {
  const path = isStaffRole(role) ? '/admins/me' : '/socio/me';
  return apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  }, token);
}

export function updateProfile(token: string, role: string, input: { nombre?: string; apellido?: string; telefono?: string }) {
  return apiFetch(role === 'socio' || role === 'profe' ? '/socio/me' : '/admins/me', { method: 'PATCH', body: JSON.stringify(input) }, token);
}

export type CompleteOnboardingInput = {
  titular_nombre: string;
  titular_apellido: string;
  cuit_cuil: string;
  nueva_password: string;
  cuota_monto?: number;
  direccion?: string;
  provincia?: string;
  ciudad?: string;
};

export function completeOnboarding(token: string, input: CompleteOnboardingInput) {
  return apiFetch<ClubInfo>('/clubs/me/onboarding', {
    method: 'PATCH',
    body: JSON.stringify(input),
  }, token);
}

export { API_URL };
