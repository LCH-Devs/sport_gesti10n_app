import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { NOT_DELETED } from '../common/club-users';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';
import { assertEspaciosLibres } from '../espacios/ocupacion-agenda';

const eventoInclude = {
  espacios: {
    select: {
      espacio_id: true,
      espacio: { select: { id: true, nombre: true } },
    },
  },
} as const;

type EventoRow = {
  espacios?: Array<{ espacio_id: number; espacio: { id: number; nombre: string } }>;
  [key: string]: unknown;
};

function flattenEvento<T extends EventoRow>(e: T) {
  const { espacios = [], ...rest } = e;
  return {
    ...rest,
    espacio_ids: espacios.map((x) => x.espacio_id),
    espacios: espacios.map((x) => x.espacio),
  };
}

@Injectable()
export class EventosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async list(clubId: number, tipo?: string) {
    const rows = await this.prisma.evento.findMany({
      where: {
        club_id: clubId,
        ...NOT_DELETED,
        ...(tipo && { tipo: tipo as 'seminario' | 'torneo' | 'social' }),
      },
      include: eventoInclude,
      orderBy: { fecha: 'desc' },
    });
    return rows.map(flattenEvento);
  }

  async getOne(clubId: number, id: number) {
    return flattenEvento(await this.ensureInClub(clubId, id));
  }

  async create(clubId: number, dto: CreateEventoDto) {
    const fecha = new Date(dto.fecha);
    const fin = dto.fin ? new Date(dto.fin) : null;
    const todos = dto.todos_espacios ?? false;
    const espacioIds = await this.resolveEspacioIds(clubId, todos, dto.espacio_ids ?? []);
    await this.assertOcupacion(clubId, fecha, fin, todos, espacioIds);

    const created = await this.prisma.evento.create({
      data: {
        club_id: clubId,
        titulo: dto.titulo.trim(),
        tipo: dto.tipo,
        visibilidad: dto.visibilidad ?? 'privado',
        fecha,
        fin,
        todos_espacios: todos,
        lugar: dto.lugar,
        descripcion: dto.descripcion,
        imagen_url: dto.imagen_url,
        publicado: dto.publicado ?? false,
        torneo_id: dto.torneo_id,
        ...(!todos && espacioIds.length
          ? { espacios: { create: espacioIds.map((espacio_id) => ({ espacio_id })) } }
          : {}),
      },
      include: eventoInclude,
    });
    return flattenEvento(created);
  }

  /** Sube el flyer/imagen del evento. Se puede llamar antes o después de crear el evento en sí. */
  async uploadImagen(file: Express.Multer.File) {
    const url = await this.media.saveEntityImage('eventos', Date.now(), file);
    return { url };
  }

  async update(clubId: number, id: number, dto: UpdateEventoDto) {
    const current = await this.ensureInClub(clubId, id);
    const fecha = dto.fecha !== undefined ? new Date(dto.fecha) : current.fecha;
    const fin =
      dto.fin !== undefined ? (dto.fin ? new Date(dto.fin) : null) : current.fin;
    const todos = dto.todos_espacios ?? current.todos_espacios;
    const incomingIds =
      dto.espacio_ids !== undefined
        ? dto.espacio_ids
        : current.espacios.map((x) => x.espacio_id);
    const espacioIds = await this.resolveEspacioIds(clubId, todos, incomingIds);
    await this.assertOcupacion(clubId, fecha, fin, todos, espacioIds, id);

    const replaceEspacios =
      dto.espacio_ids !== undefined || dto.todos_espacios !== undefined;

    const updated = await this.prisma.evento.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.visibilidad !== undefined && { visibilidad: dto.visibilidad }),
        ...(dto.fecha !== undefined && { fecha }),
        ...(dto.fin !== undefined && { fin }),
        ...(dto.todos_espacios !== undefined && { todos_espacios: dto.todos_espacios }),
        ...(dto.lugar !== undefined && { lugar: dto.lugar }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.imagen_url !== undefined && { imagen_url: dto.imagen_url }),
        ...(dto.publicado !== undefined && { publicado: dto.publicado }),
        ...(dto.torneo_id !== undefined && { torneo_id: dto.torneo_id }),
        ...(replaceEspacios && {
          espacios: {
            deleteMany: {},
            ...(!todos && espacioIds.length
              ? { create: espacioIds.map((espacio_id) => ({ espacio_id })) }
              : {}),
          },
        }),
      },
      include: eventoInclude,
    });
    return flattenEvento(updated);
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

  private async resolveEspacioIds(
    clubId: number,
    todos: boolean,
    ids: number[],
  ): Promise<number[]> {
    if (todos) {
      const all = await this.prisma.espacio.findMany({
        where: { club_id: clubId, ...NOT_DELETED },
        select: { id: true },
      });
      return all.map((e) => e.id);
    }
    if (!ids.length) return [];
    const unique = [...new Set(ids)];
    const found = await this.prisma.espacio.findMany({
      where: { club_id: clubId, id: { in: unique }, ...NOT_DELETED },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new BadRequestException('Espacio no encontrado');
    }
    return unique;
  }

  private async assertOcupacion(
    clubId: number,
    fecha: Date,
    fin: Date | null,
    todos: boolean,
    espacioIds: number[],
    ignoreEventoId?: number,
  ) {
    const ocupa = todos || espacioIds.length > 0;
    if (!ocupa) return;
    if (!fin) {
      throw new BadRequestException(
        'Indicá hora de fin para ocupar canchas con el evento',
      );
    }
    if (!(fecha < fin)) {
      throw new BadRequestException('El inicio debe ser anterior al fin');
    }
    await assertEspaciosLibres(this.prisma, {
      clubId,
      espacioIds,
      inicio: fecha,
      fin,
      ignoreEventoId,
    });
  }

  private async ensureInClub(clubId: number, id: number) {
    const e = await this.prisma.evento.findFirst({
      where: { id, club_id: clubId, ...NOT_DELETED },
      include: eventoInclude,
    });
    if (!e) throw new NotFoundException('Evento no encontrado');
    return e;
  }
}
