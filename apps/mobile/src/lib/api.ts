const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export type LoginResponse = {
  access_token: string;
  role: string;
  cuentas: Array<{ membresia_id: number; rol: string; club: { id: number; slug: string; nombre: string; logo_url: string | null } }>;
  must_complete_onboarding: boolean;
  must_change_password: boolean;
  impersonated_by_platform: boolean;
  socio?: { id: number; email: string; nombre: string; apellido: string; dni: string; estado: string; rol: string };
  admin?: { id: number; email: string; nombre: string; rol: string };
  club: { id: number; slug: string; nombre: string; color_primario: string; color_secundario: string | null; color_terciario: string | null; logo_url: string | null; cuota_monto: number; onboarding_completo: boolean };
};

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
    throw new Error(message || 'No se pudo conectar con el servidor');
  }
  return body as T;
}

export function loginSocio(email: string, password: string, clubSlug?: string) {
  return apiFetch<LoginResponse>('/auth/socio/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(clubSlug ? { club_slug: clubSlug } : {}) }),
  });
}

export { API_URL };
