import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NOT_DELETED } from '../common/club-users';
import { CreateHorarioDto, UpdateHorarioDto } from './dto/horario.dto';
import { assertHorarioLibre } from '../espacios/ocupacion-agenda';

const horarioInclude = {
  espacio: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class HorariosService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.horario.findMany({
      where: { club_id: clubId, ...NOT_DELETED },
      include: horarioInclude,
      orderBy: { hora_inicio: 'asc' },
    });
  }

  getOne(clubId: number, id: number) {
    return this.ensureInClub(clubId, id);
  }

  async create(clubId: number, dto: CreateHorarioDto) {
    const espacioId = await this.resolveEspacio(clubId, dto.espacio_id);
    const profeId = await this.resolveProfe(clubId, dto.profe_id);
    if (espacioId) {
      await assertHorarioLibre(this.prisma, {
        clubId,
        espacioId,
        dias: dto.dias,
        horaInicio: dto.hora_inicio,
        horaFin: dto.hora_fin,
      });
    }
    return this.prisma.horario.create({
      data: {
        club_id: clubId,
        titulo: dto.titulo.trim(),
        dias: dto.dias,
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        profe_id: profeId,
        espacio_id: espacioId,
        activo: dto.activo ?? true,
      },
      include: horarioInclude,
    });
  }

  async update(clubId: number, id: number, dto: UpdateHorarioDto) {
    const current = await this.ensureInClub(clubId, id);
    const profeId =
      dto.profe_id !== undefined
        ? await this.resolveProfe(clubId, dto.profe_id)
        : current.profe_id;
    const espacioId =
      dto.espacio_id !== undefined
        ? await this.resolveEspacio(clubId, dto.espacio_id)
        : current.espacio_id;
    const dias = dto.dias ?? current.dias;
    const horaInicio = dto.hora_inicio ?? current.hora_inicio;
    const horaFin = dto.hora_fin ?? current.hora_fin;
    if (espacioId) {
      await assertHorarioLibre(this.prisma, {
        clubId,
        espacioId,
        dias,
        horaInicio,
        horaFin,
        ignoreHorarioId: id,
      });
    }
    return this.prisma.horario.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.dias !== undefined && { dias: dto.dias }),
        ...(dto.hora_inicio !== undefined && { hora_inicio: dto.hora_inicio }),
        ...(dto.hora_fin !== undefined && { hora_fin: dto.hora_fin }),
        ...(dto.profe_id !== undefined && { profe_id: profeId }),
        ...(dto.espacio_id !== undefined && { espacio_id: espacioId }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
      include: horarioInclude,
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

  private async resolveEspacio(
    clubId: number,
    espacioId: number | null | undefined,
  ): Promise<number | null> {
    if (espacioId === undefined || espacioId === null) return null;
    const espacio = await this.prisma.espacio.findFirst({
      where: { id: espacioId, club_id: clubId, ...NOT_DELETED },
      select: { id: true },
    });
    if (!espacio) throw new BadRequestException('Espacio no encontrado');
    return espacio.id;
  }

  private async resolveProfe(
    clubId: number,
    profeId: number | null | undefined,
  ): Promise<number | null> {
    if (profeId === undefined || profeId === null) return null;
    const profe = await this.prisma.membresia.findFirst({
      where: {
        id: profeId,
        club_id: clubId,
        rol: 'profe',
        ...NOT_DELETED,
      },
      select: { id: true },
    });
    if (!profe) {
      throw new BadRequestException('Profesor no encontrado en este club');
    }
    return profe.id;
  }

  private async ensureInClub(clubId: number, id: number) {
    const h = await this.prisma.horario.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
      include: horarioInclude,
    });
    if (!h) throw new NotFoundException('Horario no encontrado');
    return h;
  }
}
