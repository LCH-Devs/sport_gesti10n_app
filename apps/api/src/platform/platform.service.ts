import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClubAdminDto,
  CreateClubPlatformDto,
  UpdateClubPlatformDto,
} from './dto/platform.dto';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  listClubs() {
    return this.prisma.club.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { admins: true, socios: true } },
        admins: {
          select: { id: true, email: true, nombre: true, rol: true },
          orderBy: { id: 'asc' },
          take: 5,
        },
      },
    });
  }

  async getClub(id: number) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        admins: {
          select: { id: true, email: true, nombre: true, rol: true },
          orderBy: { id: 'asc' },
        },
        _count: { select: { socios: true, pagos: true } },
      },
    });
    if (!club) throw new NotFoundException('Club no encontrado');
    return club;
  }

  async createClub(dto: CreateClubPlatformDto) {
    const slug = dto.slug.trim().toLowerCase();
    const exists = await this.prisma.club.findUnique({ where: { slug } });
    if (exists) {
      throw new BadRequestException(`Ya existe un club con slug "${slug}"`);
    }

    const password_hash = await bcrypt.hash(dto.admin_password, 10);

    return this.prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          slug,
          nombre: dto.nombre.trim(),
          logo_url: dto.logo_url || null,
          color_primario: dto.color_primario || '#2563eb',
          color_secundario: dto.color_secundario || null,
          color_terciario: dto.color_terciario || null,
          plan: dto.plan || 'basico',
          cuota_monto: dto.cuota_monto ?? 5000,
          activo: true,
        },
      });

      const admin = await tx.admin.create({
        data: {
          club_id: club.id,
          email: dto.admin_email.toLowerCase().trim(),
          nombre: dto.admin_nombre.trim(),
          password_hash,
          rol: 'admin',
        },
        select: { id: true, email: true, nombre: true, rol: true },
      });

      return { club, admin };
    });
  }

  async updateClub(id: number, dto: UpdateClubPlatformDto) {
    await this.ensureClub(id);
    return this.prisma.club.update({
      where: { id },
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
        ...(dto.plan !== undefined && { plan: dto.plan }),
        ...(dto.cuota_monto !== undefined && { cuota_monto: dto.cuota_monto }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
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
    });
  }

  async addAdmin(clubId: number, dto: CreateClubAdminDto) {
    await this.ensureClub(clubId);
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.admin.findUnique({
      where: { club_id_email: { club_id: clubId, email } },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un admin con ese email en el club');
    }
    const password_hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.admin.create({
      data: {
        club_id: clubId,
        email,
        nombre: dto.nombre.trim(),
        password_hash,
        rol: dto.rol === 'entrada' ? 'entrada' : 'admin',
      },
      select: { id: true, email: true, nombre: true, rol: true },
    });
  }

  private async ensureClub(id: number) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) throw new NotFoundException('Club no encontrado');
    return club;
  }
}
