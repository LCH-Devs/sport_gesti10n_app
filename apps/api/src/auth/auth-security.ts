/** TTL del JWT de club y plataforma. El front guarda el token en localStorage. */
export const JWT_EXPIRES_IN = '8h';
export const JWT_EXPIRES_SECONDS = 8 * 60 * 60;

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MESSAGE =
  'Demasiados intentos, esperá unos minutos';

/** 10 intentos de login por IP por minuto (Nest Throttler, ttl en ms). */
export const LOGIN_IP_LIMIT = 10;
export const LOGIN_IP_TTL_MS = 60_000;
