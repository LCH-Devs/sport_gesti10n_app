import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamiliaDto, UpdateFamiliaDto } from './dto/familia.dto';
import { flattenPerson, NOT_DELETED, personInclude } from '../common/club-users';

@Injectable()
export class FamiliasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: number) {
    const rows = await this.prisma.grupoFamiliar.findMany({
      where: { club_id: clubId, ...NOT_DELETED },
      include: {
        titular: { include: personInclude },
        socios: { where: NOT_DELETED, include: personInclude },
      },
      orderBy: { nombre: 'asc' },
    });
    return rows.map((g) => this.shape(g));
  }

  async create(clubId: number, dto: CreateFamiliaDto) {
    await this.ensureSocio(clubId, dto.titular_id);
    const memberIds = new Set(dto.socio_ids || []);
    memberIds.add(dto.titular_id);
    await this.ensureSocios(clubId, [...memberIds]);

    const grupo = await this.prisma.grupoFamiliar.create({
      data: {
        club_id: clubId,
        nombre: dto.nombre.trim(),
        titular_id: dto.titular_id,
      },
    });

    await this.prisma.membresia.updateMany({
      where: { club_id: clubId, id: { in: [...memberIds] } },
      data: { grupo_familiar_id: grupo.id },
    });

    return this.findOne(clubId, grupo.id);
  }

  async update(clubId: number, id: number, dto: UpdateFamiliaDto) {
    await this.ensureInClub(clubId, id);

    if (dto.titular_id !== undefined) {
      await this.ensureSocio(clubId, dto.titular_id);
    }

    await this.prisma.grupoFamiliar.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.titular_id !== undefined && { titular_id: dto.titular_id }),
      },
    });

    if (dto.socio_ids !== undefined) {
      const titularId =
        dto.titular_id ??
        (await this.prisma.grupoFamiliar.findUnique({ where: { id } }))!
          .titular_id;
      const memberIds = new Set(dto.socio_ids);
      memberIds.add(titularId);
      await this.ensureSocios(clubId, [...memberIds]);

      await this.prisma.membresia.updateMany({
        where: { club_id: clubId, grupo_familiar_id: id },
        data: { grupo_familiar_id: null },
      });
      await this.prisma.membresia.updateMany({
        where: { club_id: clubId, id: { in: [...memberIds] } },
        data: { grupo_familiar_id: id },
      });
    }

    return this.findOne(clubId, id);
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.membresia.updateMany({
      where: { club_id: clubId, grupo_familiar_id: id },
      data: { grupo_familiar_id: null },
    });
    await this.prisma.grupoFamiliar.update({
      where: { id },
      data: { eliminado: true },
    });
    return { ok: true };
  }

  private async findOne(clubId: number, id: number) {
    const g = await this.prisma.grupoFamiliar.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
      include: {
        titular: { include: personInclude },
        socios: { where: NOT_DELETED, include: personInclude },
      },
    });
    if (!g) throw new NotFoundException('Familia no encontrada');
    return this.shape(g);
  }

  private shape(g: {
    titular: Parameters<typeof flattenPerson>[0];
    socios: Array<Parameters<typeof flattenPerson>[0]>;
    [key: string]: unknown;
  }) {
    return {
      ...g,
      titular: flattenPerson(g.titular),
      socios: g.socios.map(flattenPerson),
    };
  }

  private async ensureInClub(clubId: number, id: number) {
    const g = await this.prisma.grupoFamiliar.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
    });
    if (!g) throw new NotFoundException('Familia no encontrada');
    return g;
  }

  private async ensureSocio(clubId: number, socioId: number) {
    const s = await this.prisma.membresia.findFirst({
      where: { id: socioId, club_id: clubId, ...NOT_DELETED },
    });
    if (!s) throw new BadRequestException(`Socio ${socioId} no encontrado`);
    return s;
  }

  private async ensureSocios(clubId: number, ids: number[]) {
    for (const id of ids) await this.ensureSocio(clubId, id);
  }
}
