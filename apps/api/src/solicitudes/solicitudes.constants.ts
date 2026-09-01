export const ESTADOS_SOLICITUD = [
  'pendiente',
  'trial',
  'aprobada',
  'cancelada',
  'borradas',
] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export const ESTADO_SOLICITUD_DEFAULT: EstadoSolicitud = 'pendiente';
