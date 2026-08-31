export class CuentaOptionDto {
  membresia_id: number;
  rol: string;
  club: {
    id: number;
    slug: string;
    nombre: string;
    logo_url: string | null;
  };
}

export class ClubDto {
  id: number;
  slug: string;
  nombre: string;
  color_primario: string;
  color_secundario: string | null;
  color_terciario: string | null;
  logo_url: string | null;
  cuota_monto: number;
  onboarding_completo: boolean;
}

export class AdminSessionDto {
  id: number;
  email: string;
  nombre: string;
  rol: string;
}

export class SocioSessionDto {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  estado: string;
  rol: string;
}

/** Respuesta de /auth/login, /auth/admin/login, /auth/socio/login y /auth/switch. */
export class LoginResponseDto {
  access_token: string;
  /** Segundos de vida del JWT (hoy 8 h). El `exp` del token es la fuente de verdad. */
  expires_in: number;
  role: string;
  cuentas: CuentaOptionDto[];
  must_complete_onboarding: boolean;
  must_change_password: boolean;
  impersonated_by_platform: boolean;
  admin?: AdminSessionDto;
  socio?: SocioSessionDto;
  club: ClubDto;
}
