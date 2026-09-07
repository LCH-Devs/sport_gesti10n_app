import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CATEGORIA_MAX_POR_CLUB,
  CATEGORIA_PLENO_NOMBRE,
  CATEGORIA_PLENO_SLUG,
  ensureDefaultCategoriaCuota,
  isDefaultCategoriaLabel,
  slugifyCategoriaNombre,
} from '../common/categorias-cuota';
import { NOT_DELETED } from '../common/club-users';
import { isValidPersonName } from '../common/dto-constraints';
import {
  CreateCategoriaCuotaDto,
  UpdateCategoriaCuotaDto,
} from './dto/categoria-cuota.dto';

@Injectable()
export class CategoriasCuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: number) {
    await this.ensureDefault(clubId);
    return this.prisma.categoriaCuota.findMany({
      where: { club_id: clubId, ...NOT_DELETED },
      orderBy: [{ es_default: 'desc' }, { nombre: 'asc' }],
    });
  }

  async create(clubId: number, dto: CreateCategoriaCuotaDto) {
    await this.ensureDefault(clubId);
    if (isDefaultCategoriaLabel(dto.nombre)) {
      throw new BadRequestException(
        'Socio pleno ya existe. Editá su monto; no lo dupliques.',
      );
    }
    const count = await this.prisma.categoriaCuota.count({
      where: { club_id: clubId, ...NOT_DELETED },
    });
    if (count >= CATEGORIA_MAX_POR_CLUB) {
      throw new BadRequestException(
        `Máximo ${CATEGORIA_MAX_POR_CLUB} categorías por club`,
      );
    }
    return this.upsertExtra(clubId, dto.nombre, dto.monto);
  }

  async update(clubId: number, id: number, dto: UpdateCategoriaCuotaDto) {
    const cat = await this.ensureInClub(clubId, id);
    if (dto.nombre !== undefined && !isValidPersonName(dto.nombre)) {
      throw new BadRequestException(
        'Nombre de categoría inválido (2 a 80 caracteres)',
      );
    }
    if (cat.es_default && dto.nombre !== undefined) {
      const slug = slugifyCategoriaNombre(dto.nombre);
      if (slug !== CATEGORIA_PLENO_SLUG && slug !== 'pleno') {
        throw new BadRequestException(
          'La categoría por defecto se llama Socio pleno',
        );
      }
    }
    if (
      dto.nombre !== undefined &&
      !cat.es_default &&
      isDefaultCategoriaLabel(dto.nombre)
    ) {
      throw new BadRequestException(
        'No podés renombrar una categoría a Socio pleno',
      );
    }

    let slug = cat.slug;
    if (dto.nombre !== undefined && !cat.es_default) {
      slug = slugifyCategoriaNombre(dto.nombre);
      const taken = await this.prisma.categoriaCuota.findFirst({
        where: {
          club_id: clubId,
          slug,
          eliminado: false,
          NOT: { id: cat.id },
        },
      });
      if (taken) {
        throw new BadRequestException('Ya hay una categoría con ese nombre');
      }
    }

    const updated = await this.prisma.categoriaCuota.update({
      where: { id: cat.id },
      data: {
        ...(dto.nombre !== undefined && {
          nombre: cat.es_default ? CATEGORIA_PLENO_NOMBRE : dto.nombre.trim(),
          slug,
        }),
        ...(dto.monto !== undefined && { monto: dto.monto }),
      },
    });

    if (updated.es_default && dto.monto !== undefined) {
      await this.prisma.club.update({
        where: { id: clubId },
        data: { cuota_monto: dto.monto },
      });
    }
    return updated;
  }

  async remove(clubId: number, id: number) {
    const cat = await this.ensureInClub(clubId, id);
    if (cat.es_default) {
      throw new BadRequestException('No se puede borrar Socio pleno');
    }
    const fallback = await this.ensureDefault(clubId);
    await this.prisma.$transaction([
      this.prisma.membresia.updateMany({
        where: { club_id: clubId, categoria_id: cat.id },
        data: { categoria_id: fallback.id },
      }),
      this.prisma.categoriaCuota.update({
        where: { id: cat.id },
        data: { eliminado: true },
      }),
    ]);
    return { ok: true };
  }

  async upsertExtra(clubId: number, nombre: string, monto: number) {
    if (isDefaultCategoriaLabel(nombre)) {
      return this.ensureDefault(clubId, { monto, syncMonto: true });
    }
    const slug = slugifyCategoriaNombre(nombre);
    const existing = await this.prisma.categoriaCuota.findFirst({
      where: { club_id: clubId, slug },
    });
    if (existing && !existing.eliminado) {
      throw new BadRequestException('Ya hay una categoría con ese nombre');
    }
    if (existing?.eliminado) {
      return this.prisma.categoriaCuota.update({
        where: { id: existing.id },
        data: {
          nombre: nombre.trim(),
          monto,
          eliminado: false,
          es_default: false,
        },
      });
    }
    return this.prisma.categoriaCuota.create({
      data: {
        club_id: clubId,
        nombre: nombre.trim(),
        slug,
        monto,
        es_default: false,
      },
    });
  }

  async ensureDefault(
    clubId: number,
    opts?: { monto?: number; syncMonto?: boolean },
  ) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { cuota_monto: true },
    });
    if (!club) throw new NotFoundException('Club no encontrado');
    return ensureDefaultCategoriaCuota(this.prisma, clubId, {
      monto: opts?.monto ?? club.cuota_monto,
      syncMonto: opts?.syncMonto,
    });
  }

  private async ensureInClub(clubId: number, id: number) {
    const cat = await this.prisma.categoriaCuota.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
    });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }
}
