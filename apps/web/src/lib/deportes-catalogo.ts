/** Deportes habituales en clubes de barrio de Argentina. */
export const DEPORTES_CATALOGO = [
  'Fútbol',
  'Fútbol 5',
  'Futsal',
  'Básquet',
  'Vóley',
  'Pádel',
  'Tenis',
  'Hockey',
  'Rugby',
  'Natación',
  'Handball',
  'Boxeo',
  'Karate',
  'Judo',
  'Atletismo',
  'Ciclismo',
  'Gimnasia',
  'Patín',
  'Pelota paleta',
  'Yoga',
  'Ajedrez',
] as const;

export function deporteKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchCatalogoDeporte(nombre: string) {
  const key = deporteKey(nombre);
  return DEPORTES_CATALOGO.find((d) => deporteKey(d) === key) ?? null;
}

export function splitDeportes(saved: string[]) {
  const catalogo: string[] = [];
  const extras: string[] = [];
  const seen = new Set<string>();
  for (const raw of saved) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = deporteKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    const match = matchCatalogoDeporte(trimmed);
    if (match) catalogo.push(match);
    else extras.push(trimmed);
  }
  return { catalogo, extras };
}

export function mergeDeportes(catalogo: string[], extras: string[]) {
  const split = splitDeportes([...catalogo, ...extras]);
  return [...split.catalogo, ...split.extras];
}
