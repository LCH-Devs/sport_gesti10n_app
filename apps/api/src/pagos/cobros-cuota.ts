export const PAGO_TIPO_CUOTA = 'cuota';
export const PAGO_TIPO_INSCRIPCION = 'inscripcion';

export function mesActualYm(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonthsYm(ym: string, n: number): string {
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function splitMonto(total: number, partes: number): number[] {
  const n = Math.max(1, Math.min(12, Math.floor(partes)));
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const rem = cents - base * n;
  return Array.from({ length: n }, (_, i) =>
    (base + (i === n - 1 ? rem : 0)) / 100,
  );
}

export function aplicarDescuentoFamiliar(monto: number, pct: number): number {
  const p = Math.min(100, Math.max(0, pct));
  return Math.round(monto * (1 - p / 100) * 100) / 100;
}

export type CuotaMesEstado =
  | 'pagado'
  | 'pendiente'
  | 'bonificado'
  | 'sin_generar';

export function estadoCuotaMes(opts: {
  pagoEstado?: string | null;
  bonificado: boolean;
}): CuotaMesEstado {
  if (opts.pagoEstado === 'pagado') return 'pagado';
  if (opts.pagoEstado === 'pendiente') return 'pendiente';
  if (opts.bonificado) return 'bonificado';
  return 'sin_generar';
}

export type SocioParaCuota = {
  id: number;
  email: string;
  grupo_familiar_id: number | null;
  grupo_nombre: string | null;
  titular_id: number | null;
  monto: number;
};

export type LoteCuota = {
  socio_id: number;
  payerEmail: string;
  grupo_familiar_id: number | null;
  monto: number;
  concepto: string;
  miembros: number;
};

export function armarLotesCuota(
  socios: SocioParaCuota[],
  opts: {
    mes: string;
    overrideMonto?: number;
    descuentoFamiliarPct: number;
    bonificados: Set<number>;
  },
): LoteCuota[] {
  const families = new Map<number, SocioParaCuota[]>();
  const solos: SocioParaCuota[] = [];

  for (const socio of socios) {
    if (socio.grupo_familiar_id) {
      const list = families.get(socio.grupo_familiar_id) ?? [];
      list.push(socio);
      families.set(socio.grupo_familiar_id, list);
    } else {
      solos.push(socio);
    }
  }

  const lotes: LoteCuota[] = [];

  for (const [grupoId, members] of families) {
    const billable = members.filter((m) => !opts.bonificados.has(m.id));
    if (billable.length === 0) continue;

    const titularId = members[0]?.titular_id;
    const titular = members.find((m) => m.id === titularId);
    const payer = titular ?? billable[0];

    let monto =
      opts.overrideMonto ?? billable.reduce((sum, m) => sum + m.monto, 0);
    if (
      opts.overrideMonto === undefined &&
      billable.length >= 2 &&
      opts.descuentoFamiliarPct > 0
    ) {
      monto = aplicarDescuentoFamiliar(monto, opts.descuentoFamiliarPct);
    }
    if (monto <= 0) continue;

    const nombre = members[0].grupo_nombre?.trim() || 'Familia';
    lotes.push({
      socio_id: payer.id,
      payerEmail: payer.email,
      grupo_familiar_id: grupoId,
      monto,
      concepto: `${nombre} · ${billable.length} socio${billable.length === 1 ? '' : 's'}`,
      miembros: billable.length,
    });
  }

  for (const socio of solos) {
    if (opts.bonificados.has(socio.id)) continue;
    const monto = opts.overrideMonto ?? socio.monto;
    if (opts.overrideMonto === undefined && monto <= 0) continue;
    lotes.push({
      socio_id: socio.id,
      payerEmail: socio.email,
      grupo_familiar_id: null,
      monto,
      concepto: `Cuota ${opts.mes}`,
      miembros: 1,
    });
  }

  return lotes;
}
