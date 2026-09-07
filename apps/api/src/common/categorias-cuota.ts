export const CATEGORIA_PLENO_NOMBRE = 'Socio pleno';
export const CATEGORIA_PLENO_SLUG = 'socio-pleno';
export const CATEGORIA_MAX_POR_CLUB = 20;

type CategoriaRow = {
  id: number;
  club_id: number;
  nombre: string;
  slug: string;
  monto: number;
  es_default: boolean;
  eliminado: boolean;
};

type CategoriaDb = {
  categoriaCuota: {
    findFirst: (args: object) => Promise<CategoriaRow | null>;
    create: (args: object) => Promise<CategoriaRow>;
    update: (args: object) => Promise<CategoriaRow>;
  };
};

export function slugifyCategoriaNombre(nombre: string) {
  const slug = nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'categoria';
}

export function isDefaultCategoriaLabel(raw: string) {
  if (!raw.trim()) return true;
  const slug = slugifyCategoriaNombre(raw);
  return slug === CATEGORIA_PLENO_SLUG || slug === 'pleno';
}

export async function ensureDefaultCategoriaCuota(
  db: CategoriaDb,
  clubId: number,
  opts?: { monto?: number; syncMonto?: boolean },
): Promise<CategoriaRow> {
  const existing = await db.categoriaCuota.findFirst({
    where: { club_id: clubId, slug: CATEGORIA_PLENO_SLUG },
  });
  const monto = opts?.monto ?? 5000;
  if (!existing) {
    return db.categoriaCuota.create({
      data: {
        club_id: clubId,
        nombre: CATEGORIA_PLENO_NOMBRE,
        slug: CATEGORIA_PLENO_SLUG,
        monto,
        es_default: true,
        eliminado: false,
      },
    });
  }
  if (existing.eliminado) {
    return db.categoriaCuota.update({
      where: { id: existing.id },
      data: {
        eliminado: false,
        es_default: true,
        nombre: CATEGORIA_PLENO_NOMBRE,
        ...(opts?.syncMonto && opts.monto !== undefined ? { monto: opts.monto } : {}),
      },
    });
  }
  if (opts?.syncMonto && opts.monto !== undefined && existing.monto !== opts.monto) {
    return db.categoriaCuota.update({
      where: { id: existing.id },
      data: { monto: opts.monto, es_default: true },
    });
  }
  if (!existing.es_default) {
    return db.categoriaCuota.update({
      where: { id: existing.id },
      data: { es_default: true },
    });
  }
  return existing;
}

export function matchCategoriaCuota(
  categorias: Array<Pick<CategoriaRow, 'id' | 'nombre' | 'slug' | 'es_default'>>,
  raw?: string | null,
) {
  const live = categorias;
  if (!raw?.trim() || isDefaultCategoriaLabel(raw)) {
    return live.find((c) => c.es_default) ?? live[0] ?? null;
  }
  const slug = slugifyCategoriaNombre(raw);
  return (
    live.find((c) => c.slug === slug) ||
    live.find((c) => slugifyCategoriaNombre(c.nombre) === slug) ||
    null
  );
}
