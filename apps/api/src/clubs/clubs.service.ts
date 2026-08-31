import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { UpdateClubConfigDto } from './dto/update-club-config.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { clubNombreInUseWhere, CLUB_NOMBRE_TAKEN } from '../common/club-users';

const CLUB_PUBLIC_SELECT = {
  id: true,
  slug: true,
  nombre: true,
  logo_url: true,
  color_primario: true,
  color_secundario: true,
  color_terciario: true,
  cuota_monto: true,
  plan: true,
  activo: true,
  eliminado: true,
  onboarding_completo: true,
  cuit_cuil: true,
  titular_nombre: true,
  titular_apellido: true,
  direccion: true,
  provincia: true,
  ciudad: true,
  ubicacion_json: true,
  telefono_club: true,
  email_contacto: true,
  regla_moroso_cuotas: true,
  bloquear_reservas: true,
  bloquear_entrada: true,
  cumples_auto: true,
  max_reservas_activas: true,
  cancelar_reserva_horas: true,
} as const;

const CLUB_LOGIN_SELECT = {
  id: true,
  slug: true,
  nombre: true,
  logo_url: true,
  color_primario: true,
  color_secundario: true,
  color_terciario: true,
  activo: true,
  eliminado: true,
} as const;

@Injectable()
export class ClubsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  buscar(q: string) {
    return this.prisma.club.findMany({
      where: {
        eliminado: false,
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        nombre: true,
        logo_url: true,
        color_primario: true,
        color_secundario: true,
        color_terciario: true,
      },
      take: 20,
      orderBy: { nombre: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const club = await this.prisma.club.findUnique({
      where: { slug },
      select: CLUB_LOGIN_SELECT,
    });
    if (!club || club.eliminado) throw new NotFoundException('Club no encontrado');
    return club;
  }

  async findById(id: number) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: CLUB_PUBLIC_SELECT,
    });
    if (!club || club.eliminado) throw new NotFoundException('Club no encontrado');
    return club;
  }

  async updateConfig(clubId: number, dto: UpdateClubConfigDto) {
    await this.findById(clubId);
    if (dto.nombre !== undefined) {
      const nombreTaken = await this.prisma.club.findFirst({
        where: clubNombreInUseWhere(dto.nombre, clubId),
      });
      if (nombreTaken) {
        throw new BadRequestException(CLUB_NOMBRE_TAKEN);
      }
    }
    return this.prisma.club.update({
      where: { id: clubId },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.logo_url !== undefined && { logo_url: dto.logo_url }),
        ...(dto.color_primario !== undefined && {
          color_primario: dto.color_primario,
        }),
        ...(dto.color_secundario !== undefined && {
          color_secundario: dto.color_secundario || null,
        }),
        ...(dto.color_terciario !== undefined && {
          color_terciario: dto.color_terciario || null,
        }),
        ...(dto.cuota_monto !== undefined && { cuota_monto: dto.cuota_monto }),
        ...(dto.regla_moroso_cuotas !== undefined && {
          regla_moroso_cuotas: dto.regla_moroso_cuotas,
        }),
        ...(dto.bloquear_reservas !== undefined && {
          bloquear_reservas: dto.bloquear_reservas,
        }),
        ...(dto.bloquear_entrada !== undefined && {
          bloquear_entrada: dto.bloquear_entrada,
        }),
        ...(dto.cumples_auto !== undefined && {
          cumples_auto: dto.cumples_auto,
        }),
        ...(dto.max_reservas_activas !== undefined && {
          max_reservas_activas: dto.max_reservas_activas,
        }),
        ...(dto.cancelar_reserva_horas !== undefined && {
          cancelar_reserva_horas: dto.cancelar_reserva_horas,
        }),
      },
      select: CLUB_PUBLIC_SELECT,
    });
  }

  async completeOnboarding(
    clubId: number,
    adminId: number,
    dto: CompleteOnboardingDto,
  ) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');
    if (club.onboarding_completo) {
      throw new BadRequestException('El onboarding ya está completo');
    }

    const password_hash = await bcrypt.hash(dto.nueva_password, 10);

    await this.prisma.$transaction([
      this.prisma.club.update({
        where: { id: clubId },
        data: {
          onboarding_completo: true,
          titular_nombre: dto.titular_nombre.trim(),
          titular_apellido: dto.titular_apellido.trim(),
          cuit_cuil: dto.cuit_cuil.trim(),
          ...(dto.direccion !== undefined && { direccion: dto.direccion }),
          ...(dto.provincia !== undefined && { provincia: dto.provincia }),
          ...(dto.ciudad !== undefined && { ciudad: dto.ciudad }),
          ...(dto.ubicacion_json !== undefined && {
            ubicacion_json: dto.ubicacion_json as Prisma.InputJsonValue,
          }),
          ...(dto.telefono_club !== undefined && {
            telefono_club: dto.telefono_club,
          }),
          ...(dto.logo_url !== undefined && { logo_url: dto.logo_url || null }),
          ...(dto.color_primario !== undefined && {
            color_primario: dto.color_primario,
          }),
          ...(dto.color_secundario !== undefined && {
            color_secundario: dto.color_secundario || null,
          }),
          ...(dto.color_terciario !== undefined && {
            color_terciario: dto.color_terciario || null,
          }),
          ...(dto.cuota_monto !== undefined && { cuota_monto: dto.cuota_monto }),
        },
      }),
      this.prisma.membresia.update({
        where: { id: adminId },
        data: {
          must_change_password: false,
          usuario: {
            update: {
              password_hash,
              nombre: `${dto.titular_nombre.trim()} ${dto.titular_apellido.trim()}`,
            },
          },
        },
      }),
    ]);

    return this.findById(clubId);
  }

  async uploadLogo(clubId: number, file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Elegí una imagen');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('El logo no puede superar 2 MB');
    }
    if (!this.media.extForMime(file.mimetype)) {
      throw new BadRequestException('Solo JPG, PNG, WEBP o GIF');
    }

    await this.findById(clubId);
    const logo_url = await this.media.saveClubLogo(clubId, file);

    return this.prisma.club.update({
      where: { id: clubId },
      data: { logo_url },
      select: CLUB_PUBLIC_SELECT,
    });
  }
}

