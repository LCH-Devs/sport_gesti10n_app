import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { NOT_DELETED } from '../common/club-users';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';

@Injectable()
export class EventosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  list(clubId: number, tipo?: string) {
    return this.prisma.evento.findMany({
      where: {
        club_id: clubId,
        ...NOT_DELETED,
        ...(tipo && { tipo: tipo as any }),
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async getOne(clubId: number, id: number) {
    return this.ensureInClub(clubId, id);
  }

  create(clubId: number, dto: CreateEventoDto) {
    return this.prisma.evento.create({
      data: {
        club_id: clubId,
        titulo: dto.titulo.trim(),
        tipo: dto.tipo,
        visibilidad: dto.visibilidad ?? 'privado',
        fecha: new Date(dto.fecha),
        lugar: dto.lugar,
        descripcion: dto.descripcion,
        imagen_url: dto.imagen_url,
        publicado: dto.publicado ?? false,
        torneo_id: dto.torneo_id,
      },
    });
  }

  /** Sube el flyer/imagen del evento. Se puede llamar antes o después de crear el evento en sí. */
  async uploadImagen(file: Express.Multer.File) {
    const url = await this.media.saveEntityImage('eventos', Date.now(), file);
    return { url };
  }

  async update(clubId: number, id: number, dto: UpdateEventoDto) {
    await this.ensureInClub(clubId, id);
    return this.prisma.evento.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.visibilidad !== undefined && { visibilidad: dto.visibilidad }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.lugar !== undefined && { lugar: dto.lugar }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.imagen_url !== undefined && { imagen_url: dto.imagen_url }),
        ...(dto.publicado !== undefined && { publicado: dto.publicado }),
        ...(dto.torneo_id !== undefined && { torneo_id: dto.torneo_id }),
      },
    });
  }

  async remove(clubId: number, id: number) {
    await this.ensureInClub(clubId, id);
    await this.prisma.evento.update({
      where: { id },
      data: { eliminado: true },
    });
    return { ok: true };
  }

  /** Eventos públicos y publicados, de cualquier club (feed cross-tenant). */
  listPublicos() {
    return this.prisma.evento.findMany({
      where: {
        ...NOT_DELETED,
        visibilidad: 'publico',
        publicado: true,
        fecha: { gte: new Date(new Date().toDateString()) },
      },
      include: { club: { select: { id: true, nombre: true, slug: true, logo_url: true } } },
      orderBy: { fecha: 'asc' },
      take: 100,
    });
  }

  private async ensureInClub(clubId: number, id: number) {
    const e = await this.prisma.evento.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
    });
    if (!e) throw new NotFoundException('Evento no encontrado');
    return e;
  }
}
