import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NOT_DELETED } from '../common/club-users';
import { CreateNoticiaDto, UpdateNoticiaDto } from './dto/noticia.dto';

@Injectable()
export class NoticiasService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number, esEvento?: boolean) {
    return this.prisma.noticia.findMany({
      where: {
        club_id: clubId,
        ...NOT_DELETED,
        ...(esEvento !== undefined && { es_evento: esEvento }),
      },
      orderBy: { fecha: 'desc' },
    });
  }

  create(clubId: number, dto: CreateNoticiaDto) {
    return this.prisma.noticia.create({
      data: {
        club_id: clubId,
        titulo: dto.titulo.trim(),
        cuerpo: dto.cuerpo,
        imagen_url: dto.imagen_url,
        es_evento: dto.es_evento ?? false,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        published: dto.published ?? true,
      },
    });
  }

  async update(clubId: number, id: number, dto: UpdateNoticiaDto) {
    await this.ensureInClub(clubId, id);
    return this.prisma.noticia.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.cuerpo !== undefined && { cuerpo: dto.cuerpo }),
        ...(dto.imagen_url !== undefined && { imagen_url: dto.imagen_url }),
        ...(dto.es_evento !== undefined && { es_evento: dto.es_evento }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.published !== undefined && { published: dto.published }),
      },
    });
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.noticia.update({
      where: { id },
      data: { eliminado: true },
    });
    return { ok: true };
  }

  private async ensureInClub(clubId: number, id: number) {
    const n = await this.prisma.noticia.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
    });
    if (!n) throw new NotFoundException('Noticia no encontrada');
    return n;
  }
}

