import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NOT_DELETED } from '../common/club-users';
import { CreateHorarioDto, UpdateHorarioDto } from './dto/horario.dto';

@Injectable()
export class HorariosService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.horario.findMany({
      where: { club_id: clubId, ...NOT_DELETED },
      orderBy: { hora_inicio: 'asc' },
    });
  }

  create(clubId: number, dto: CreateHorarioDto) {
    return this.prisma.horario.create({
      data: {
        club_id: clubId,
        titulo: dto.titulo.trim(),
        dias: dto.dias,
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        profe_id: dto.profe_id,
        activo: dto.activo ?? true,
      },
    });
  }

  async update(clubId: number, id: number, dto: UpdateHorarioDto) {
    await this.ensureInClub(clubId, id);
    return this.prisma.horario.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.dias !== undefined && { dias: dto.dias }),
        ...(dto.hora_inicio !== undefined && { hora_inicio: dto.hora_inicio }),
        ...(dto.hora_fin !== undefined && { hora_fin: dto.hora_fin }),
        ...(dto.profe_id !== undefined && { profe_id: dto.profe_id }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.horario.update({
      where: { id },
      data: { eliminado: true },
    });
    return { ok: true };
  }

  private async ensureInClub(clubId: number, id: number) {
    const h = await this.prisma.horario.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
    });
    if (!h) throw new NotFoundException('Horario no encontrado');
    return h;
  }
}

