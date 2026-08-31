import {
  applyClubTheme,
  clearPlatformSession,
  clearSession,
  clearSocioSession,
  ClubSession,
  isStaffRole,
  LoginResult,
  saveSession,
  saveSocioSession,
  SocioSession,
} from './api';
import { handoffSessionToClub } from './tenant-host';

export function staffHomePath(
  data: Pick<LoginResult, 'must_complete_onboarding' | 'must_change_password'>,
  paths?: { staff?: string; onboarding?: string; changePassword?: string },
) {
  if (data.must_complete_onboarding) {
    return paths?.onboarding || '/gestion/onboarding';
  }
  if (data.must_change_password) {
    return paths?.changePassword || '/gestion/cambiar-clave';
  }
  return paths?.staff || '/dashboard';
}

export function persistLogin(
  data: LoginResult,
  paths?: { staff?: string; member?: string; onboarding?: string; changePassword?: string },
) {
  const memberHome = paths?.member || '/socio';
  if (isStaffRole(data.role) && data.admin) {
    const session: ClubSession = {
      access_token: data.access_token,
      role: data.role,
      cuentas: data.cuentas,
      must_complete_onboarding: data.must_complete_onboarding,
      must_change_password: data.must_change_password,
      impersonated_by_platform: data.impersonated_by_platform,
      admin: data.admin,
      club: data.club,
    };
    saveSession(session);
    clearSocioSession();
    clearPlatformSession();
    applyClubTheme(data.club);
    return { kind: 'admin' as const, session, next: staffHomePath(data, paths) };
  }
  if (!data.socio) {
    throw new Error('Respuesta de login inválida');
  }
  const session: SocioSession = {
    access_token: data.access_token,
    role: data.role,
    cuentas: data.cuentas,
    socio: data.socio,
    club: data.club,
  };
  saveSocioSession(session);
  clearSession();
  clearPlatformSession();
  applyClubTheme(data.club);
  return { kind: 'socio' as const, session, next: memberHome };
}

export function enterAfterLogin(
  data: LoginResult,
  routerPush: (href: string) => void,
  paths?: { staff?: string; member?: string; onboarding?: string; changePassword?: string },
) {
  const { kind, session, next } = persistLogin(data, paths);
  if (!handoffSessionToClub(data.club.slug, next, kind, session)) {
    routerPush(next);
  }
}
