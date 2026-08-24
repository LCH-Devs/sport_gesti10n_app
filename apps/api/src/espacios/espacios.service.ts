import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEspacioDto, UpdateEspacioDto } from './dto/espacio.dto';

function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

@Injectable()
export class EspaciosService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.espacio.findMany({
      where: { club_id: clubId },
      orderBy: { nombre: 'asc' },
    });
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
      data: { activo: false },
    });
  }

  async disponibilidad(clubId: number, id: number, fecha: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('fecha debe ser YYYY-MM-DD');
    }
    const espacio = await this.ensureInClub(clubId, id);
    if (!espacio.activo) {
      throw new BadRequestException('Espacio inactivo');
    }

    const dayStart = new Date(`${fecha}T00:00:00`);
    const dayEnd = new Date(`${fecha}T23:59:59.999`);

    const reservas = await this.prisma.reserva.findMany({
      where: {
        club_id: clubId,
        espacio_id: id,
        estado: 'confirmada',
        inicio: { lt: dayEnd },
        fin: { gt: dayStart },
      },
    });

    const apertura = parseHm(espacio.hora_apertura);
    const cierre = parseHm(espacio.hora_cierre);
    const slot = espacio.duracion_slot_min;
    const slots: Array<{ inicio: string; fin: string; libre: boolean }> = [];

    for (let t = apertura; t + slot <= cierre; t += slot) {
      const slotInicio = new Date(dayStart);
      slotInicio.setHours(Math.floor(t / 60), t % 60, 0, 0);
      const slotFin = new Date(slotInicio);
      slotFin.setMinutes(slotFin.getMinutes() + slot);

      const overlap = reservas.some(
        (r: any) => r.inicio < slotFin && r.fin > slotInicio,
      );
      slots.push({
        inicio: `${fecha}T${toHm(t)}:00`,
        fin: `${fecha}T${toHm(t + slot)}:00`,
        libre: !overlap,
      });
    }

    return {
      espacio_id: id,
      fecha,
      duracion_slot_min: slot,
      slots: slots.filter((s: any) => s.libre),
      todos: slots,
    };
  }

  private async ensureInClub(clubId: number, id: number) {
    const espacio = await this.prisma.espacio.findFirst({
      where: { id, club_id: clubId },
    });
    if (!espacio) throw new NotFoundException('Espacio no encontrado');
    return espacio;
  }
}

