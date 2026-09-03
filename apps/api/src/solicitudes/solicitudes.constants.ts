export const ESTADOS_SOLICITUD = [
  'pendiente',
  'trial',
  'aprobada',
  'cancelada',
  'borradas',
] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export const ESTADO_SOLICITUD_DEFAULT: EstadoSolicitud = 'pendiente';

/** Duración del periodo de prueba al pasar a `trial`. */
export const TRIAL_DIAS = 30;
/** Aviso cuando restan estos días (a los 20 del trial). */
export const TRIAL_AVISO_DIAS_RESTANTES = 10;
export const TRIAL_MS = TRIAL_DIAS * 24 * 60 * 60 * 1000;
export const TRIAL_AVISO_MS = TRIAL_AVISO_DIAS_RESTANTES * 24 * 60 * 60 * 1000;

export function finTrial(fechaTrial: Date): Date {
  return new Date(fechaTrial.getTime() + TRIAL_MS);
}

export function msRestantesTrial(fechaTrial: Date, now = new Date()): number {
  return finTrial(fechaTrial).getTime() - now.getTime();
}

export function debeAvisarTrial10d(fechaTrial: Date, now = new Date()): boolean {
  const ms = msRestantesTrial(fechaTrial, now);
  return ms > 0 && ms <= TRIAL_AVISO_MS;
}
