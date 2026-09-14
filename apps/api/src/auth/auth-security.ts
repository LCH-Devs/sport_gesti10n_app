/** TTL del JWT de club y plataforma. El front guarda el token en localStorage. */
export const JWT_EXPIRES_IN = '8h';
export const JWT_EXPIRES_SECONDS = 8 * 60 * 60;

/**
 * Valores de JWT_SECRET que circulan en el repo (docker-compose, .env.example,
 * fallback de dev). Si alguno de estos llega a producción tal cual, el chequeo
 * de "obligatorio en prod" no alcanza porque la variable SÍ está definida.
 */
const KNOWN_INSECURE_JWT_SECRETS = new Set([
  'dev-secret',
  'cambialo-en-produccion-clubapp-jwt',
]);

const MIN_PROD_JWT_SECRET_LENGTH = 32;

/**
 * Resuelve el secreto de JWT a usar y valida que producción no arranque con
 * un secreto ausente, de ejemplo/dev, o demasiado corto.
 */
export function resolveJwtSecret(
  rawSecret: string | undefined,
  nodeEnv: string | undefined,
): string {
  const secret = rawSecret?.trim();
  const isProd = nodeEnv === 'production';

  if (!secret) {
    if (isProd) throw new Error('JWT_SECRET es obligatorio en producción');
    return 'dev-secret';
  }

  if (isProd && KNOWN_INSECURE_JWT_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET no puede ser el valor de ejemplo del repo en producción',
    );
  }

  if (isProd && secret.length < MIN_PROD_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET debe tener al menos ${MIN_PROD_JWT_SECRET_LENGTH} caracteres en producción`,
    );
  }

  return secret;
}

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MESSAGE =
  'Demasiados intentos, esperá unos minutos';

/** 10 intentos de login por IP por minuto (Nest Throttler, ttl en ms). */
export const LOGIN_IP_LIMIT = 10;
export const LOGIN_IP_TTL_MS = 60_000;
