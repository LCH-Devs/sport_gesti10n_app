import {
  applyClubTheme,
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

export const V2_LOGIN_PATHS = {
  staff: '/gestion',
  member: '/miembro',
  onboarding: '/gestion/onboarding',
};

export function persistLogin(
  data: LoginResult,
  paths?: { staff?: string; member?: string; onboarding?: string },
) {
  const staffHome = paths?.staff || V2_LOGIN_PATHS.staff;
  const memberHome = paths?.member || V2_LOGIN_PATHS.member;
  const onboarding = paths?.onboarding || V2_LOGIN_PATHS.onboarding;
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
    applyClubTheme(data.club);
    return { kind: 'admin' as const, session, next: data.must_complete_onboarding ? onboarding : staffHome };
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
  applyClubTheme(data.club);
  return { kind: 'socio' as const, session, next: memberHome };
}

export function enterAfterLogin(
  data: LoginResult,
  routerPush: (href: string) => void,
  paths?: { staff?: string; member?: string; onboarding?: string },
) {
  const { kind, session, next } = persistLogin(data, paths);
  if (!handoffSessionToClub(data.club.slug, next, kind, session)) {
    routerPush(next);
  }
}
