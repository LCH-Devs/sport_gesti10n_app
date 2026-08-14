import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClubConfigDto } from './dto/update-club-config.dto';

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
  regla_moroso_cuotas: true,
  bloquear_reservas: true,
  bloquear_entrada: true,
  cumples_auto: true,
  max_reservas_activas: true,
  cancelar_reserva_horas: true,
} as const;

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  buscar(q: string) {
    return this.prisma.club.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
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
      select: CLUB_PUBLIC_SELECT,
    });
    if (!club) throw new NotFoundException('Club no encontrado');
    return club;
  }

  async findById(id: number) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: CLUB_PUBLIC_SELECT,
    });
    if (!club) throw new NotFoundException('Club no encontrado');
    return club;
  }

  async updateConfig(clubId: number, dto: UpdateClubConfigDto) {
    await this.findById(clubId);
    return this.prisma.club.update({
      where: { id: clubId },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
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
}
