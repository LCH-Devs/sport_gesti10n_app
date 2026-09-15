export type TimeFormat = '24h' | '12h';

export const TIME_FORMAT_KEY = 'clubapp_time_format';

export function readTimeFormat(): TimeFormat {
  if (typeof window === 'undefined') return '24h';
  return localStorage.getItem(TIME_FORMAT_KEY) === '12h' ? '12h' : '24h';
}

const LOCALE = 'es-AR';

function asDate(value: string | Date): Date | null {
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

function timeOpts(hour12: boolean): Intl.DateTimeFormatOptions {
  return {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    hourCycle: hour12 ? 'h12' : 'h23',
  };
}

export function formatDateTime(value: string | Date, hour12: boolean): string {
  const d = asDate(value);
  if (!d) return '—';
  return d.toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...timeOpts(hour12),
  });
}

export function formatTime(value: string | Date, hour12: boolean): string {
  const d = asDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString(LOCALE, timeOpts(hour12));
}

export function formatDate(value: string | Date, hour12: boolean): string {
  const d = asDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Convierte un `HH:mm` guardado a 24 h o AM/PM. */
export function formatHm(hm: string, hour12: boolean): string {
  const [h, m] = hm.split(':').map(Number);
  if (!Number.isFinite(h)) return hm;
  const d = new Date(2000, 0, 1, h, m || 0, 0, 0);
  return formatTime(d, hour12);
}

export function formatHmRange(inicio: string, fin: string, hour12: boolean): string {
  return `${formatHm(inicio, hour12)} – ${formatHm(fin, hour12)}`;
}

export function formatTimeRange(
  inicio: string | Date,
  fin: string | Date,
  hour12: boolean,
): string {
  return `${formatTime(inicio, hour12)} – ${formatTime(fin, hour12)}`;
}
