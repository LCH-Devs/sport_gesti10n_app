import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEspacioDto, UpdateEspacioDto } from './dto/espacio.dto';
import { NOT_DELETED } from '../common/club-users';
import {
  addDays,
  disponibilidadSlotsForDay,
  mondayOf,
  slotMinutes,
  startOfDay,
} from './ocupacion';
import {
  busyIntervalsForSpace,
  resumenDia,
  resumenPeriodo,
} from './ocupacion-agenda';

@Injectable()
export class EspaciosService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.espacio.findMany({
      where: { club_id: clubId, ...NOT_DELETED },
      orderBy: { nombre: 'asc' },
    });
  }

  /** Portal socio: solo espacios activos, para elegir dónde reservar. */
  listActivos(clubId: number) {
    return this.prisma.espacio.findMany({
      where: { club_id: clubId, activo: true, ...NOT_DELETED },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        descripcion: true,
        duracion_slot_min: true,
        precio_opcional: true,
        hora_apertura: true,
        hora_cierre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  getOne(clubId: number, id: number) {
    return this.ensureInClub(clubId, id);
  }

  async create(clubId: number, dto: CreateEspacioDto) {
    return this.prisma.espacio.create({
      data: {
        club_id: clubId,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo.trim(),
        descripcion: dto.descripcion,
        duracion_slot_min: dto.duracion_slot_min,
        precio_opcional: dto.precio_opcional,
        hora_apertura: dto.hora_apertura,
        hora_cierre: dto.hora_cierre,
      },
    });
  }

  async update(clubId: number, id: number, dto: UpdateEspacioDto) {
    await this.ensureInClub(clubId, id);
    return this.prisma.espacio.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.duracion_slot_min !== undefined && {
          duracion_slot_min: dto.duracion_slot_min,
        }),
        ...(dto.precio_opcional !== undefined && {
          precio_opcional: dto.precio_opcional,
        }),
        ...(dto.hora_apertura !== undefined && {
          hora_apertura: dto.hora_apertura,
        }),
        ...(dto.hora_cierre !== undefined && { hora_cierre: dto.hora_cierre }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    return this.prisma.espacio.update({
      where: { id },
      data: { eliminado: true },
    });
  }

  async ocupacion(clubId: number, fecha?: string) {
    if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('fecha debe ser YYYY-MM-DD');
    }
    const ref = fecha
      ? startOfDay(new Date(`${fecha}T00:00:00`))
      : startOfDay(new Date());
    const dayStart = ref;
    const weekStart = mondayOf(ref);
    const weekEnd = addDays(weekStart, 7);
    const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    const rangeStart = monthStart < weekStart ? monthStart : weekStart;
    const rangeEnd = monthEnd > weekEnd ? monthEnd : weekEnd;

    const espacios = await this.list(clubId);
    const out = [];
    for (const e of espacios) {
      const busy = await busyIntervalsForSpace(this.prisma, {
        clubId,
        espacioId: e.id,
        rangeStart,
        rangeEnd,
      });
      const dia = resumenDia(e.hora_apertura, e.hora_cierre, dayStart, busy);
      out.push({
        espacio_id: e.id,
        dia: { pct: dia.pct },
        semana: { pct: resumenPeriodo(e.hora_apertura, e.hora_cierre, weekStart, weekEnd, busy) },
        mes: { pct: resumenPeriodo(e.hora_apertura, e.hora_cierre, monthStart, monthEnd, busy) },
        calor: dia.calor,
      });
    }
    return out;
  }

  async disponibilidad(clubId: number, id: number, fecha: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('fecha debe ser YYYY-MM-DD');
    }
    const espacio = await this.ensureInClub(clubId, id);
    if (!espacio.activo) {
      throw new BadRequestException('Espacio inactivo');
    }

    const dayStart = startOfDay(new Date(`${fecha}T00:00:00`));
    const dayEnd = addDays(dayStart, 1);
    const busy = await busyIntervalsForSpace(this.prisma, {
      clubId,
      espacioId: id,
      rangeStart: dayStart,
      rangeEnd: dayEnd,
    });

    const slots = disponibilidadSlotsForDay({
      fecha,
      dayStart,
      apertura: espacio.hora_apertura,
      cierre: espacio.hora_cierre,
      duracionSlotMin: espacio.duracion_slot_min,
      busy,
    });

    return {
      espacio_id: id,
      fecha,
      duracion_slot_min: slotMinutes(espacio.duracion_slot_min),
      slots: slots.filter((s) => s.libre),
      todos: slots,
    };
  }

  private async ensureInClub(clubId: number, id: number) {
    const espacio = await this.prisma.espacio.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
    });
    if (!espacio) throw new NotFoundException('Espacio no encontrado');
    return espacio;
  }
}
