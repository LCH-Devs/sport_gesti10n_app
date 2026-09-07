export const PLAN_UPGRADE_REQUIRED = 'PLAN_UPGRADE_REQUIRED';

export type PlanTramoRow = {
  id?: number;
  nombre: string;
  desde: number;
  hasta: number | null;
  precio_usd: number;
  orden: number;
};

export type PlanUpgradePayload = {
  code: typeof PLAN_UPGRADE_REQUIRED;
  socios_actuales: number;
  extras: number;
  plan_hasta: number;
  plan_nombre: string;
  precio_actual: number;
  precio_proximo: number;
  hasta_proximo: number | null;
  plan_proximo_nombre: string;
  aplica_desde: string;
};

export const DEFAULT_PLAN_TRAMOS: PlanTramoRow[] = [
  { nombre: 'Hasta 50 socios', desde: 1, hasta: 50, precio_usd: 15, orden: 1 },
  { nombre: 'Hasta 100 socios', desde: 51, hasta: 100, precio_usd: 30, orden: 2 },
  { nombre: 'Más de 100 socios', desde: 101, hasta: null, precio_usd: 45, orden: 3 },
];

export function tramoParaCantidad(tramos: PlanTramoRow[], cantidad: number) {
  const n = Math.max(1, Math.floor(cantidad));
  const match = [...tramos]
    .sort((a, b) => a.desde - b.desde)
    .find((t) => n >= t.desde && (t.hasta == null || n <= t.hasta));
  if (!match) {
    throw new Error('No hay un plan para esa cantidad de socios');
  }
  return match;
}

export function proximoTramo(tramos: PlanTramoRow[], actual: PlanTramoRow) {
  return [...tramos]
    .sort((a, b) => a.desde - b.desde)
    .find((t) => t.desde > (actual.hasta ?? Number.MAX_SAFE_INTEGER)) ?? null;
}

export function tramoPorHasta(tramos: PlanTramoRow[], hasta: number) {
  return (
    [...tramos]
      .sort((a, b) => a.desde - b.desde)
      .find((t) => t.hasta === hasta || (t.hasta == null && hasta >= 100000)) ??
    tramoParaCantidad(tramos, hasta)
  );
}

export function proximoCiclo(from = new Date()) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
}

export function validateTramos(tramos: PlanTramoRow[]) {
  if (!tramos.length) {
    throw new Error('Tiene que haber al menos un plan');
  }
  const sorted = [...tramos].sort((a, b) => a.desde - b.desde);
  if (sorted[0].desde !== 1) {
    throw new Error('El primer plan tiene que empezar en 1 socio');
  }
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (t.desde < 1) throw new Error('La cantidad mínima no puede ser menor a 1');
    if (t.precio_usd < 0) throw new Error('El precio no puede ser negativo');
    if (!t.nombre.trim()) throw new Error('Cada plan necesita un nombre');
    if (t.hasta != null && t.hasta < t.desde) {
      throw new Error(`El plan "${t.nombre}" tiene un tope menor al inicio`);
    }
    const isLast = i === sorted.length - 1;
    if (isLast && t.hasta != null) {
      throw new Error('El último plan no puede tener tope (más de X socios)');
    }
    if (!isLast) {
      if (t.hasta == null) {
        throw new Error('Solo el último plan puede ser sin tope');
      }
      const next = sorted[i + 1];
      if (next.desde !== t.hasta + 1) {
        throw new Error(
          `Hay un hueco o solape entre "${t.nombre}" y "${next.nombre}"`,
        );
      }
    }
  }
  return sorted.map((t, i) => ({ ...t, orden: i + 1, nombre: t.nombre.trim() }));
}

export function topeEfectivo(hasta: number | null) {
  return hasta ?? 100000;
}
