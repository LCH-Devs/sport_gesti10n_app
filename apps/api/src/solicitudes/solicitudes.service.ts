import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NOT_DELETED } from '../common/club-users';
import {
  CreateSolicitudDto,
  UpdateSolicitudDto,
} from './dto/solicitudes.dto';
import {
  ESTADO_SOLICITUD_DEFAULT,
  EstadoSolicitud,
} from './solicitudes.constants';

export function dataPorCambioEstado(
  estado: EstadoSolicitud,
  at = new Date(),
) {
  if (estado === 'trial') {
    return { estado, fecha_trial: at };
  }
  if (estado === 'aprobada') {
    return { estado, fecha_aprobada: at };
  }
  if (estado === 'cancelada') {
    return { estado, fecha_cancelada: at };
  }
  if (estado === 'borradas') {
    return { estado, eliminado: true, fecha_eliminada: at };
  }
  return { estado };
}

@Injectable()
export class SolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSolicitudDto) {
    const fecha_solicitud = new Date();
    const created = await this.prisma.solicitud.create({
      data: {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        nombre_club: dto.nombre_club.trim(),
        email: dto.email.trim().toLowerCase(),
        telefono: dto.telefono.trim(),
        cantidad_miembros: dto.cantidad_miembros,
        cantidad_socios: dto.cantidad_socios ?? 0,
        estado: ESTADO_SOLICITUD_DEFAULT,
      },
      select: { id: true, estado: true },
    });
    await this.prisma.$executeRaw`
      UPDATE "Solicitud"
      SET "fecha_solicitud" = ${fecha_solicitud}
      WHERE "id" = ${created.id}
    `;
    return { ...created, fecha_solicitud };
  }

  list(estado?: EstadoSolicitud) {
    return this.prisma.solicitud.findMany({
      where: {
        ...NOT_DELETED,
        ...(estado ? { estado } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async countPendientes() {
    const count = await this.prisma.solicitud.count({
      where: { estado: 'pendiente', ...NOT_DELETED },
    });
    return { count };
  }

  async getOne(id: number) {
    const row = await this.prisma.solicitud.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!row) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    return row;
  }

  async update(id: number, dto: UpdateSolicitudDto) {
    if (!dto.estado) {
      throw new BadRequestException('Indicá el estado');
    }
    await this.getOne(id);
    return this.prisma.solicitud.update({
      where: { id },
      data: dataPorCambioEstado(dto.estado),
    });
  }
}
