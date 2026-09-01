import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  CreatePublicacionSocialDto,
  ListPublicacionSocialQuery,
  UpdatePublicacionSocialDto,
} from './dto/social.dto';

const clubPublicSelect = {
  id: true,
  nombre: true,
  slug: true,
  logo_url: true,
  activo: true,
  eliminado: true,
} as const;

const WRITE_FORBIDDEN =
  'Solo administradores del club o superadmin pueden publicar';

type PostRow = {
  id: number;
  club_id: number | null;
  autor_tipo: string;
  autor_id: number;
  titulo: string;
  cuerpo: string;
  imagen_url: string | null;
  fecha_evento: Date | null;
  lugar: string | null;
  visible: boolean;
  created_at: Date;
  club: {
    id: number;
    nombre: string;
    slug: string;
    logo_url: string | null;
    activo: boolean;
    eliminado: boolean;
  } | null;
};

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async listFeed(query: ListPublicacionSocialQuery) {
    const take = query.take ?? 30;
    const skip = query.skip ?? 0;
    const rows = await this.prisma.publicacionSocial.findMany({
      where: {
        eliminado: false,
        visible: true,
        ...(query.club_id ? { club_id: query.club_id } : {}),
        OR: [
          { club_id: null },
          { club: { eliminado: false, activo: true } },
        ],
      },
      include: { club: { select: clubPublicSelect } },
      orderBy: { created_at: 'desc' },
      take,
      skip,
    });
    return rows.map((row) => this.shape(row));
  }

  async getOne(id: number, user: JwtPayload) {
    const row = await this.prisma.publicacionSocial.findFirst({
      where: { id, eliminado: false },
      include: { club: { select: clubPublicSelect } },
    });
    if (!row) throw new NotFoundException('Publicación no encontrada');

    const moderator = this.canModerate(user, row);
    if (!moderator) {
      if (!row.visible) throw new NotFoundException('Publicación no encontrada');
      if (row.club && (row.club.eliminado || !row.club.activo)) {
        throw new NotFoundException('Publicación no encontrada');
      }
    }
    return this.shape(row);
  }

  async listMine(user: JwtPayload) {
    if (user.role === 'platform') {
      const rows = await this.prisma.publicacionSocial.findMany({
        where: { eliminado: false },
        include: { club: { select: clubPublicSelect } },
        orderBy: { created_at: 'desc' },
      });
      return rows.map((row) => this.shape(row));
    }
    if (user.role !== 'admin' || !user.club_id) {
      throw new ForbiddenException(WRITE_FORBIDDEN);
    }
    const rows = await this.prisma.publicacionSocial.findMany({
      where: { eliminado: false, club_id: user.club_id },
      include: { club: { select: clubPublicSelect } },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((row) => this.shape(row));
  }

  async create(user: JwtPayload, dto: CreatePublicacionSocialDto) {
    const writer = this.assertWriter(user);
    let club_id: number | null = null;
    let autor_tipo: 'admin' | 'platform';
    let autor_id: number;

    if (writer === 'platform') {
      autor_tipo = 'platform';
      autor_id = user.sub;
      if (dto.club_id) {
        await this.ensureClubVivo(dto.club_id);
        club_id = dto.club_id;
      }
    } else {
      autor_tipo = 'admin';
      autor_id = user.sub;
      club_id = user.club_id!;
      await this.ensureClubVivo(club_id);
    }

    const row = await this.prisma.publicacionSocial.create({
      data: {
        club_id,
        autor_tipo,
        autor_id,
        titulo: dto.titulo.trim(),
        cuerpo: dto.cuerpo.trim(),
        imagen_url: dto.imagen_url?.trim() || null,
        fecha_evento: dto.fecha_evento ? new Date(dto.fecha_evento) : null,
        lugar: dto.lugar?.trim() || null,
        visible: dto.visible ?? true,
      },
      include: { club: { select: clubPublicSelect } },
    });
    return this.shape(row);
  }

  async update(user: JwtPayload, id: number, dto: UpdatePublicacionSocialDto) {
    const row = await this.requireForWrite(user, id);
    const updated = await this.prisma.publicacionSocial.update({
      where: { id: row.id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo.trim() }),
        ...(dto.cuerpo !== undefined && { cuerpo: dto.cuerpo.trim() }),
        ...(dto.imagen_url !== undefined && {
          imagen_url: dto.imagen_url?.trim() || null,
        }),
        ...(dto.fecha_evento !== undefined && {
          fecha_evento: dto.fecha_evento ? new Date(dto.fecha_evento) : null,
        }),
        ...(dto.lugar !== undefined && { lugar: dto.lugar?.trim() || null }),
        ...(dto.visible !== undefined && { visible: dto.visible }),
      },
      include: { club: { select: clubPublicSelect } },
    });
    return this.shape(updated);
  }

  async remove(user: JwtPayload, id: number) {
    const row = await this.requireForWrite(user, id);
    await this.prisma.publicacionSocial.update({
      where: { id: row.id },
      data: { eliminado: true, visible: false },
    });
    return { ok: true };
  }

  private assertWriter(user: JwtPayload): 'admin' | 'platform' {
    if (user.role === 'platform') return 'platform';
    if (user.role === 'admin' && user.club_id) return 'admin';
    throw new ForbiddenException(WRITE_FORBIDDEN);
  }

  private canModerate(
    user: JwtPayload,
    row: { club_id: number | null },
  ): boolean {
    if (user.role === 'platform') return true;
    return (
      user.role === 'admin' &&
      !!user.club_id &&
      row.club_id === user.club_id
    );
  }

  private async requireForWrite(user: JwtPayload, id: number) {
    this.assertWriter(user);
    const row = await this.prisma.publicacionSocial.findFirst({
      where: { id, eliminado: false },
      include: { club: { select: clubPublicSelect } },
    });
    if (!row) throw new NotFoundException('Publicación no encontrada');
    if (!this.canModerate(user, row)) {
      throw new ForbiddenException(
        'No podés editar publicaciones de otro club',
      );
    }
    return row;
  }

  private async ensureClubVivo(clubId: number) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId, eliminado: false, activo: true },
      select: { id: true },
    });
    if (!club) {
      throw new NotFoundException('Club no encontrado o no está activo');
    }
  }

  private shape(row: PostRow) {
    return {
      id: row.id,
      titulo: row.titulo,
      cuerpo: row.cuerpo,
      imagen_url: row.imagen_url,
      fecha_evento: row.fecha_evento,
      lugar: row.lugar,
      visible: row.visible,
      created_at: row.created_at,
      autor_tipo: row.autor_tipo,
      club: row.club
        ? {
            id: row.club.id,
            nombre: row.club.nombre,
            slug: row.club.slug,
            logo_url: row.club.logo_url,
          }
        : null,
    };
  }
}
