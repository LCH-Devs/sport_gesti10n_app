/** Recorta, saca vacíos y duplicados (case-insensitive). */
export function normalizeDeportes(deportes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of deportes) {
    const v = typeof raw === 'string' ? raw.trim() : '';
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}
