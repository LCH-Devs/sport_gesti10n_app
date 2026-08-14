import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateActividadDto,
  SetSociosActividadDto,
  UpdateActividadDto,
} from './dto/actividad.dto';

@Injectable()
export class ActividadesService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.actividad.findMany({
      where: { club_id: clubId },
      include: {
        profe: {
          select: { id: true, nombre: true, apellido: true },
        },
        _count: { select: { socios: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  create(clubId: number, dto: CreateActividadDto) {
    return this.prisma.actividad.create({
      data: {
        club_id: clubId,
        nombre: dto.nombre.trim(),
        modo_cobro: dto.modo_cobro,
        monto_adicional: dto.monto_adicional ?? 0,
        profe_id: dto.profe_id,
        comision_tipo: dto.comision_tipo,
        comision_valor: dto.comision_valor,
        activo: dto.activo ?? true,
      },
    });
  }

  async update(clubId: number, id: number, dto: UpdateActividadDto) {
    await this.ensureInClub(clubId, id);
    return this.prisma.actividad.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.modo_cobro !== undefined && { modo_cobro: dto.modo_cobro }),
        ...(dto.monto_adicional !== undefined && {
          monto_adicional: dto.monto_adicional,
        }),
        ...(dto.profe_id !== undefined && { profe_id: dto.profe_id }),
        ...(dto.comision_tipo !== undefined && {
          comision_tipo: dto.comision_tipo,
        }),
        ...(dto.comision_valor !== undefined && {
          comision_valor: dto.comision_valor,
        }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.socioActividad.deleteMany({
      where: { actividad_id: id },
    });
    await this.prisma.actividad.delete({ where: { id } });
    return { ok: true };
  }

  async setSocios(clubId: number, id: number, dto: SetSociosActividadDto) {
    await this.ensureInClub(clubId, id);
    if (dto.socio_ids.length) {
      const count = await this.prisma.socio.count({
        where: { club_id: clubId, id: { in: dto.socio_ids } },
      });
      if (count !== dto.socio_ids.length) {
        throw new BadRequestException('Algunos socios no pertenecen al club');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.socioActividad.deleteMany({ where: { actividad_id: id } });
      if (dto.socio_ids.length) {
        await tx.socioActividad.createMany({
          data: dto.socio_ids.map((socio_id) => ({
            socio_id,
            actividad_id: id,
          })),
        });
      }
    });

    return this.getSocios(clubId, id);
  }

  async getSocios(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    const rows = await this.prisma.socioActividad.findMany({
      where: { actividad_id: id },
      include: {
        socio: {
          select: {
            id: true,
            dni: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            estado: true,
          },
        },
      },
    });
    return rows.map((r) => r.socio);
  }

  private async ensureInClub(clubId: number, id: number) {
    const a = await this.prisma.actividad.findFirst({
      where: { id, club_id: clubId },
    });
    if (!a) throw new NotFoundException('Actividad no encontrada');
    return a;
  }
}
