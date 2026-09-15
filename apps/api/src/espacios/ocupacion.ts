/** Ocupación de un espacio: ventana útil = apertura → cierre − 1 h. */

export function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function toHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Cierre menos 60 minutos; si quedaría ≤ apertura, se usa el cierre. */
export function usableWindowMins(apertura: string, cierre: string): {
  start: number;
  end: number;
} {
  const start = parseHm(apertura);
  const cierreM = parseHm(cierre);
  const end = cierreM - 60 > start ? cierreM - 60 : cierreM;
  return { start, end };
}

function minsOnDay(when: Date, day: Date): number {
  return Math.round((when.getTime() - startOfDay(day).getTime()) / 60000);
}

/** La reserva/evento tiene que empezar ≥ apertura y terminar ≤ cierre − 1 h, el mismo día. */
export function intervalWithinUsableWindow(
  inicio: Date,
  fin: Date,
  apertura: string,
  cierre: string,
): boolean {
  if (!(inicio < fin)) return false;
  const day = startOfDay(inicio);
  const win = usableWindowMins(apertura, cierre);
  const startM = minsOnDay(inicio, day);
  const endM = minsOnDay(fin, day);
  return startM >= win.start && endM <= win.end;
}

export function slotMinutes(raw: number | null | undefined): number {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 15 ? n : 60;
}

export type IntervalMins = { start: number; end: number };

/**
 * Duración mínima = 1 turno. El inicio va en la grilla desde la apertura
 * o justo cuando se libera el espacio (fin de un entrenamiento/reserva).
 * 18:43 no vale; 19:30–20:30 sí, si algo ocupó hasta las 19:30.
 */
export function reservaFitsSlot(
  inicio: Date,
  fin: Date,
  apertura: string,
  cierre: string,
  duracionSlotMin: number,
  extraStartMins: readonly number[] = [],
): boolean {
  if (!intervalWithinUsableWindow(inicio, fin, apertura, cierre)) return false;
  const slot = slotMinutes(duracionSlotMin);
  const day = startOfDay(inicio);
  const win = usableWindowMins(apertura, cierre);
  const startM = minsOnDay(inicio, day);
  const endM = minsOnDay(fin, day);
  const duration = endM - startM;
  if (duration < slot || duration % slot !== 0) return false;
  const onGrid = (startM - win.start) % slot === 0;
  if (!onGrid && !extraStartMins.includes(startM)) return false;
  return true;
}

/** Recorta ocupaciones al día (minutos desde 00:00). */
export function intervalsOnDay(
  day: Date,
  busy: ReadonlyArray<{ start: Date; end: Date }>,
): IntervalMins[] {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  return busy
    .filter((b) => b.start < dayEnd && b.end > dayStart)
    .map((b) => ({
      start: Math.max(
        0,
        minsOnDay(b.start < dayStart ? dayStart : b.start, dayStart),
      ),
      end: Math.min(
        24 * 60,
        minsOnDay(b.end > dayEnd ? dayEnd : b.end, dayStart),
      ),
    }))
    .filter((i) => i.end > i.start);
}

/**
 * Inicios extra: al terminar una ocupación, y de ahí de a un turno
 * (19:30, 20:30…) para no perder el hueco ni el encadenado.
 */
export function extraStartMinutesFromBusy(
  winStart: number,
  winEnd: number,
  slot: number,
  busy: IntervalMins[],
): number[] {
  const out: number[] = [];
  for (const b of mergeIntervals(busy)) {
    if (b.end < winStart) continue;
    for (let t = b.end; t + slot <= winEnd; t += slot) {
      out.push(t);
    }
  }
  return out;
}

export function extraStartMinutesFromBusyDates(
  day: Date,
  apertura: string,
  cierre: string,
  duracionSlotMin: number,
  busy: ReadonlyArray<{ start: Date; end: Date }>,
): number[] {
  const win = usableWindowMins(apertura, cierre);
  const slot = slotMinutes(duracionSlotMin);
  return extraStartMinutesFromBusy(
    win.start,
    win.end,
    slot,
    intervalsOnDay(day, busy),
  );
}

export function candidateStartMinutes(
  apertura: string,
  cierre: string,
  duracionSlotMin: number,
  busy: IntervalMins[],
): number[] {
  const slot = slotMinutes(duracionSlotMin);
  const win = usableWindowMins(apertura, cierre);
  const grid: number[] = [];
  for (let t = win.start; t + slot <= win.end; t += slot) grid.push(t);
  const extra = extraStartMinutesFromBusy(win.start, win.end, slot, busy);
  return [...new Set([...grid, ...extra])].sort((a, b) => a - b);
}

export function disponibilidadSlotsForDay(opts: {
  fecha: string;
  dayStart: Date;
  apertura: string;
  cierre: string;
  duracionSlotMin: number;
  busy: ReadonlyArray<{ start: Date; end: Date }>;
}): Array<{ inicio: string; fin: string; libre: boolean }> {
  const slot = slotMinutes(opts.duracionSlotMin);
  const starts = candidateStartMinutes(
    opts.apertura,
    opts.cierre,
    slot,
    intervalsOnDay(opts.dayStart, opts.busy),
  );
  return starts.map((t) => {
    const slotInicio = dateAtHm(opts.dayStart, toHm(t));
    const slotFin = dateAtHm(opts.dayStart, toHm(t + slot));
    const overlap = opts.busy.some((b) =>
      intervalsOverlap(slotInicio, slotFin, b.start, b.end),
    );
    return {
      inicio: `${opts.fecha}T${toHm(t)}:00`,
      fin: `${opts.fecha}T${toHm(t + slot)}:00`,
      libre: !overlap,
    };
  });
}

export function mergeIntervals(list: IntervalMins[]): IntervalMins[] {
  const sorted = [...list]
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  const out: IntervalMins[] = [];
  for (const cur of sorted) {
    const last = out[out.length - 1];
    if (!last || cur.start > last.end) out.push({ ...cur });
    else last.end = Math.max(last.end, cur.end);
  }
  return out;
}

export function occupiedMinutes(
  windowStart: number,
  windowEnd: number,
  busy: IntervalMins[],
): number {
  if (windowEnd <= windowStart) return 0;
  const clipped = busy
    .map((b) => ({
      start: Math.max(windowStart, b.start),
      end: Math.min(windowEnd, b.end),
    }))
    .filter((b) => b.end > b.start);
  return mergeIntervals(clipped).reduce((sum, b) => sum + (b.end - b.start), 0);
}

export function pct(occupied: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(Math.min(1, occupied / total) * 100);
}

export type CalorFranjas = {
  manana: { start: number; end: number };
  tarde: { start: number; end: number };
  noche: { start: number; end: number };
};

/** Mañana hasta 13:00, tarde 13–18, noche 18 → fin útil. Se recortan a la ventana. */
export function calorFranjas(usableStart: number, usableEnd: number): CalorFranjas {
  const clip = (start: number, end: number) => ({
    start: Math.max(usableStart, start),
    end: Math.min(usableEnd, end),
  });
  return {
    manana: clip(usableStart, 13 * 60),
    tarde: clip(13 * 60, 18 * 60),
    noche: clip(18 * 60, usableEnd),
  };
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

const DOW = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;

export function weekdayKey(d: Date): string {
  return DOW[d.getDay()];
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Acepta `lun,mie,vie`, `Lunes,Miércoles,Viernes` o `Lun y Mié`. */
export function horarioCaeEnDia(dias: string, d: Date): boolean {
  const keys = dias
    .toLowerCase()
    .split(/[,;/]+|\s+y\s+/)
    .map((x) => stripAccents(x.trim()).slice(0, 3))
    .filter(Boolean);
  return keys.includes(weekdayKey(d));
}

export function dateAtHm(day: Date, hm: string): Date {
  const mins = parseHm(hm);
  const out = new Date(day);
  out.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return out;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}
