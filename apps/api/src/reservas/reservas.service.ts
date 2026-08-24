import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  list(
    clubId: number,
    filtros: { desde?: string; hasta?: string; espacio_id?: number },
  ) {
    const where: {
      club_id: number;
      espacio_id?: number;
      inicio?: { gte?: Date; lte?: Date };
    } = { club_id: clubId };

    if (filtros.espacio_id) where.espacio_id = filtros.espacio_id;
    if (filtros.desde || filtros.hasta) {
      where.inicio = {};
      if (filtros.desde) where.inicio.gte = new Date(filtros.desde);
      if (filtros.hasta) where.inicio.lte = new Date(filtros.hasta);
    }

    return this.prisma.reserva.findMany({
      where,
      include: {
        socio: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
        espacio: { select: { id: true, nombre: true, tipo: true } },
      },
      orderBy: { inicio: 'asc' },
    });
  }

  async create(clubId: number, dto: CreateReservaDto) {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    if (!(inicio < fin)) {
      throw new BadRequestException('inicio debe ser anterior a fin');
    }

    const espacio = await this.prisma.espacio.findFirst({
      where: { id: dto.espacio_id, club_id: clubId, activo: true },
    });
    if (!espacio) {
      throw new BadRequestException('Espacio no encontrado o inactivo');
    }

    const socio = await this.prisma.socio.findFirst({
      where: { id: dto.socio_id, club_id: clubId },
    });
    if (!socio) throw new BadRequestException('Socio no encontrado');
    if (socio.estado === 'suspendido') {
      throw new BadRequestException('Socio suspendido');
    }

    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');

    if (club.bloquear_reservas) {
      const pendientes = await this.prisma.pago.count({
        where: {
          club_id: clubId,
          socio_id: socio.id,
          estado: 'pendiente',
        },
      });
      if (pendientes >= club.regla_moroso_cuotas) {
        throw new BadRequestException(
          'Socio con cuotas pendientes; reservas bloqueadas',
        );
      }
    }

    const ahora = new Date();
    const activas = await this.prisma.reserva.count({
      where: {
        club_id: clubId,
        socio_id: socio.id,
        estado: 'confirmada',
        inicio: { gt: ahora },
      },
    });
    if (activas >= club.max_reservas_activas) {
      throw new BadRequestException(
        `Máximo de ${club.max_reservas_activas} reservas activas alcanzado`,
      );
    }

    const solape = await this.prisma.reserva.findFirst({
      where: {
        club_id: clubId,
        espacio_id: espacio.id,
        estado: 'confirmada',
        inicio: { lt: fin },
        fin: { gt: inicio },
      },
    });
    if (solape) {
      throw new BadRequestException(
        'Horario ocupado: solapamiento con otra reserva confirmada',
      );
    }

    return this.prisma.reserva.create({
      data: {
        club_id: clubId,
        espacio_id: espacio.id,
        socio_id: socio.id,
        inicio,
        fin,
        nota: dto.nota,
        estado: 'confirmada',
      },
      include: {
        socio: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
        espacio: { select: { id: true, nombre: true } },
      },
    });
  }

  async cancelar(clubId: number, id: number) {
    const reserva = await this.prisma.reserva.findFirst({
      where: { id, club_id: clubId },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    return this.prisma.reserva.update({
      where: { id },
      data: { estado: 'cancelada' },
    });
  }
}

