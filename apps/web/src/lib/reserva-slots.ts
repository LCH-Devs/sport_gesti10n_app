export function parseHm(hm: string): number {
  const [h, m] = String(hm).split(':').map(Number);
  return h * 60 + (m || 0);
}

export function toHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function usableWindowMins(apertura: string, cierre: string): {
  start: number;
  end: number;
} {
  const start = parseHm(apertura);
  const cierreM = parseHm(cierre);
  const end = cierreM - 60 > start ? cierreM - 60 : cierreM;
  return { start, end };
}

export function slotMinutes(raw: number | null | undefined): number {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 15 ? n : 60;
}

export function startSlotTimes(
  apertura: string,
  cierre: string,
  duracionSlotMin: number,
): string[] {
  const slot = slotMinutes(duracionSlotMin);
  const win = usableWindowMins(apertura, cierre);
  const out: string[] = [];
  for (let t = win.start; t + slot <= win.end; t += slot) {
    out.push(toHm(t));
  }
  return out;
}

/** Une la grilla del espacio con inicios extra (p. ej. 19:30 al liberarse). */
export function unionStartTimes(
  base: readonly string[],
  extra: readonly string[] | undefined = [],
): string[] {
  return [...new Set([...base, ...(extra ?? []).filter(Boolean)])].sort(
    (a, b) => parseHm(a) - parseHm(b),
  );
}

export function endSlotTimes(
  startHm: string,
  apertura: string,
  cierre: string,
  duracionSlotMin: number,
): string[] {
  const slot = slotMinutes(duracionSlotMin);
  const win = usableWindowMins(apertura, cierre);
  const start = parseHm(startHm);
  const out: string[] = [];
  for (let t = start + slot; t <= win.end; t += slot) {
    out.push(toHm(t));
  }
  return out;
}

export function formatDurationMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return h === 1 ? '1 h' : `${h} h`;
  return `${m} min`;
}

export function localIso(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}`).toISOString();
}

export function todayYmd(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowHm(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function hmFromDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Si la hora no cae en un turno, usa el turno anterior (o el primero). */
export function snapToStartSlot(hm: string, inicios: readonly string[]): string {
  if (!hm || inicios.length === 0) return '';
  if (inicios.includes(hm)) return hm;
  const m = parseHm(hm);
  let best = '';
  for (const s of inicios) {
    if (parseHm(s) <= m) best = s;
  }
  return best || inicios[0];
}
