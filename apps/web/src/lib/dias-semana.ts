/** Días de la semana. El valor persistido es el nombre en español. */
export const DIAS_SEMANA = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
] as const;

export type DiaKey = (typeof DIAS_SEMANA)[number]['key'];

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokenToKey(raw: string): DiaKey | null {
  const t = stripAccents(raw.toLowerCase().trim());
  if (!t) return null;
  const prefix = t.slice(0, 3);
  return DIAS_SEMANA.find((d) => d.key === prefix)?.key ?? null;
}

/** Acepta `lun,mie,vie`, `Lunes,Miércoles` o `Lun y Mié`. */
export function parseDias(raw: string): DiaKey[] {
  const tokens = raw.split(/[,;/]+|\s+y\s+/i);
  const seen = new Set<DiaKey>();
  for (const token of tokens) {
    const key = tokenToKey(token);
    if (key) seen.add(key);
  }
  return DIAS_SEMANA.map((d) => d.key).filter((k) => seen.has(k));
}

export function serializeDias(keys: readonly string[]): string {
  const set = new Set(keys);
  return DIAS_SEMANA.filter((d) => set.has(d.key))
    .map((d) => d.label)
    .join(',');
}

export function formatDias(raw: string): string {
  const keys = parseDias(raw);
  if (!keys.length) return raw || '—';
  return serializeDias(keys).replace(/,/g, ', ');
}
