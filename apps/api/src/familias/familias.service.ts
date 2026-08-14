import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamiliaDto, UpdateFamiliaDto } from './dto/familia.dto';

const socioSelect = {
  id: true,
  dni: true,
  nombre: true,
  apellido: true,
  email: true,
  telefono: true,
  estado: true,
} as const;

@Injectable()
export class FamiliasService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.grupoFamiliar.findMany({
      where: { club_id: clubId },
      include: {
        titular: { select: socioSelect },
        socios: { select: socioSelect },
      },
      orderBy: { nombre: 'asc' },
    });
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

    await this.prisma.socio.updateMany({
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

      await this.prisma.socio.updateMany({
        where: { club_id: clubId, grupo_familiar_id: id },
        data: { grupo_familiar_id: null },
      });
      await this.prisma.socio.updateMany({
        where: { club_id: clubId, id: { in: [...memberIds] } },
        data: { grupo_familiar_id: id },
      });
    }

    return this.findOne(clubId, id);
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.socio.updateMany({
      where: { club_id: clubId, grupo_familiar_id: id },
      data: { grupo_familiar_id: null },
    });
    await this.prisma.grupoFamiliar.delete({ where: { id } });
    return { ok: true };
  }

  private async findOne(clubId: number, id: number) {
    const g = await this.prisma.grupoFamiliar.findFirst({
      where: { id, club_id: clubId },
      include: {
        titular: { select: socioSelect },
        socios: { select: socioSelect },
      },
    });
    if (!g) throw new NotFoundException('Familia no encontrada');
    return g;
  }

  private async ensureInClub(clubId: number, id: number) {
    const g = await this.prisma.grupoFamiliar.findFirst({
      where: { id, club_id: clubId },
    });
    if (!g) throw new NotFoundException('Familia no encontrada');
    return g;
  }

  private async ensureSocio(clubId: number, socioId: number) {
    const s = await this.prisma.socio.findFirst({
      where: { id: socioId, club_id: clubId },
    });
    if (!s) throw new BadRequestException(`Socio ${socioId} no encontrado`);
    return s;
  }

  private async ensureSocios(clubId: number, ids: number[]) {
    for (const id of ids) await this.ensureSocio(clubId, id);
  }
}
