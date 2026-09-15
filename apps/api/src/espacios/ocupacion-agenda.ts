import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NOT_DELETED } from '../common/club-users';
import {
  addDays,
  calorFranjas,
  dateAtHm,
  horarioCaeEnDia,
  intervalsOverlap,
  occupiedMinutes,
  parseHm,
  pct,
  startOfDay,
  usableWindowMins,
  type IntervalMins,
} from './ocupacion';

export type AgendaDb = PrismaService | Prisma.TransactionClient;
export const HORARIO_LOOKAHEAD_DAYS = 56;

export const OCUPADO_MSG = 'Horario ocupado: se pisa con una reserva, evento o entrenamiento';

type BusyInterval = { start: Date; end: Date };

export async function busyIntervalsForSpace(
  prisma: AgendaDb,
  opts: {
    clubId: number;
    espacioId: number;
    rangeStart: Date;
    rangeEnd: Date;
    ignoreReservaId?: number;
    ignoreEventoId?: number;
    ignoreHorarioId?: number;
  },
): Promise<BusyInterval[]> {
  const { clubId, espacioId, rangeStart, rangeEnd } = opts;
  const out: BusyInterval[] = [];

  const reservas = await prisma.reserva.findMany({
    where: {
      club_id: clubId,
      espacio_id: espacioId,
      estado: 'confirmada',
      ...(opts.ignoreReservaId ? { id: { not: opts.ignoreReservaId } } : {}),
      inicio: { lt: rangeEnd },
      fin: { gt: rangeStart },
    },
    select: { inicio: true, fin: true },
  });
  for (const r of reservas) out.push({ start: r.inicio, end: r.fin });

  const eventos = await prisma.evento.findMany({
    where: {
      club_id: clubId,
      ...NOT_DELETED,
      ...(opts.ignoreEventoId ? { id: { not: opts.ignoreEventoId } } : {}),
      fin: { not: null },
      fecha: { lt: rangeEnd },
      AND: [{ fin: { gt: rangeStart } }],
      OR: [
        { todos_espacios: true },
        { espacios: { some: { espacio_id: espacioId } } },
      ],
    },
    select: { fecha: true, fin: true },
  });
  for (const e of eventos) {
    if (!e.fin) continue;
    out.push({ start: e.fecha, end: e.fin });
  }

  const horarios = await prisma.horario.findMany({
    where: {
      club_id: clubId,
      espacio_id: espacioId,
      activo: true,
      ...NOT_DELETED,
      ...(opts.ignoreHorarioId ? { id: { not: opts.ignoreHorarioId } } : {}),
    },
    select: { dias: true, hora_inicio: true, hora_fin: true },
  });
  for (const h of horarios) {
    for (let d = startOfDay(rangeStart); d < rangeEnd; d = addDays(d, 1)) {
      if (!horarioCaeEnDia(h.dias, d)) continue;
      const start = dateAtHm(d, h.hora_inicio);
      const end = dateAtHm(d, h.hora_fin);
      if (start < rangeEnd && end > rangeStart) out.push({ start, end });
    }
  }

  return out;
}

export async function espacioOcupadoEnRango(
  prisma: AgendaDb,
  opts: {
    clubId: number;
    espacioId: number;
    inicio: Date;
    fin: Date;
    ignoreReservaId?: number;
    ignoreEventoId?: number;
    ignoreHorarioId?: number;
  },
): Promise<boolean> {
  const busy = await busyIntervalsForSpace(prisma, {
    clubId: opts.clubId,
    espacioId: opts.espacioId,
    rangeStart: opts.inicio,
    rangeEnd: opts.fin,
    ignoreReservaId: opts.ignoreReservaId,
    ignoreEventoId: opts.ignoreEventoId,
    ignoreHorarioId: opts.ignoreHorarioId,
  });
  return busy.some((b) => intervalsOverlap(opts.inicio, opts.fin, b.start, b.end));
}

function toMinsOnDay(day: Date, when: Date): number {
  const start = startOfDay(day).getTime();
  return Math.round((when.getTime() - start) / 60000);
}

function busyMinsForDay(day: Date, busy: BusyInterval[]): IntervalMins[] {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  return busy
    .filter((b) => b.start < dayEnd && b.end > dayStart)
    .map((b) => ({
      start: Math.max(0, toMinsOnDay(day, b.start < dayStart ? dayStart : b.start)),
      end: Math.min(
        24 * 60,
        toMinsOnDay(day, b.end > dayEnd ? dayEnd : b.end),
      ),
    }));
}

export type OcupacionEspacio = {
  espacio_id: number;
  dia: { pct: number };
  semana: { pct: number };
  mes: { pct: number };
  calor: { manana: number; tarde: number; noche: number };
};

export function resumenDia(
  apertura: string,
  cierre: string,
  day: Date,
  busy: BusyInterval[],
): { pct: number; calor: { manana: number; tarde: number; noche: number } } {
  const win = usableWindowMins(apertura, cierre);
  const total = win.end - win.start;
  const mins = busyMinsForDay(day, busy);
  const occ = occupiedMinutes(win.start, win.end, mins);
  const franjas = calorFranjas(win.start, win.end);
  const calorPct = (f: { start: number; end: number }) => {
    const t = f.end - f.start;
    if (t <= 0) return 0;
    return pct(occupiedMinutes(f.start, f.end, mins), t);
  };
  return {
    pct: pct(occ, total),
    calor: {
      manana: calorPct(franjas.manana),
      tarde: calorPct(franjas.tarde),
      noche: calorPct(franjas.noche),
    },
  };
}

export function resumenPeriodo(
  apertura: string,
  cierre: string,
  from: Date,
  toExclusive: Date,
  busy: BusyInterval[],
): number {
  const win = usableWindowMins(apertura, cierre);
  const perDay = win.end - win.start;
  if (perDay <= 0) return 0;
  let occ = 0;
  let days = 0;
  for (let d = startOfDay(from); d < toExclusive; d = addDays(d, 1)) {
    days += 1;
    occ += occupiedMinutes(win.start, win.end, busyMinsForDay(d, busy));
  }
  return pct(occ, perDay * days);
}

export async function assertEspaciosLibres(
  prisma: AgendaDb,
  opts: {
    clubId: number;
    espacioIds: number[];
    inicio: Date;
    fin: Date;
    ignoreReservaId?: number;
    ignoreEventoId?: number;
    ignoreHorarioId?: number;
  },
) {
  const unique = [...new Set(opts.espacioIds)];
  for (const espacioId of unique) {
    const ocupado = await espacioOcupadoEnRango(prisma, {
      clubId: opts.clubId,
      espacioId,
      inicio: opts.inicio,
      fin: opts.fin,
      ignoreReservaId: opts.ignoreReservaId,
      ignoreEventoId: opts.ignoreEventoId,
      ignoreHorarioId: opts.ignoreHorarioId,
    });
    if (ocupado) throw new BadRequestException(OCUPADO_MSG);
  }
}

export async function assertHorarioLibre(
  prisma: AgendaDb,
  opts: {
    clubId: number;
    espacioId: number;
    dias: string;
    horaInicio: string;
    horaFin: string;
    ignoreHorarioId?: number;
  },
) {
  const startM = parseHm(opts.horaInicio);
  const endM = parseHm(opts.horaFin);
  if (!(startM < endM)) {
    throw new BadRequestException('hora_inicio debe ser anterior a hora_fin');
  }
  const rangeStart = startOfDay(new Date());
  const rangeEnd = addDays(rangeStart, HORARIO_LOOKAHEAD_DAYS);
  const busy = await busyIntervalsForSpace(prisma, {
    clubId: opts.clubId,
    espacioId: opts.espacioId,
    rangeStart,
    rangeEnd,
    ignoreHorarioId: opts.ignoreHorarioId,
  });
  for (let d = rangeStart; d < rangeEnd; d = addDays(d, 1)) {
    if (!horarioCaeEnDia(opts.dias, d)) continue;
    const start = dateAtHm(d, opts.horaInicio);
    const end = dateAtHm(d, opts.horaFin);
    if (busy.some((b) => intervalsOverlap(start, end, b.start, b.end))) {
      throw new BadRequestException(OCUPADO_MSG);
    }
  }
}

