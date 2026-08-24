import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CreateClubAdminDto,
  CreateClubPlatformDto,
  CreatePlatformAdminDto,
  UpdateClubPlatformDto,
  UpdatePlatformAdminDto,
} from './dto/platform.dto';

function slugify(nombre: string) {
  const base = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'club';
}

function randomPassword() {
  return randomBytes(9).toString('base64url').slice(0, 12);
}

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

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
    const slug = await this.uniqueSlug(slugify(dto.nombre));
    const password = randomPassword();
    const password_hash = await bcrypt.hash(password, 10);
    const adminEmail = dto.admin_email.toLowerCase().trim();
    const adminNombre = dto.admin_nombre?.trim() || 'Admin';
    const webUrl = (
      this.config.get<string>('WEB_APP_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const login_url = `${webUrl}/login/${slug}`;

    const created = await this.prisma.$transaction(async (tx: any) => {
      const club = await tx.club.create({
        data: {
          slug,
          nombre: dto.nombre.trim(),
          precio_usd_mes: dto.precio_usd_mes,
          activo: true,
          onboarding_completo: false,
        },
      });

      const admin = await tx.admin.create({
        data: {
          club_id: club.id,
          email: adminEmail,
          nombre: adminNombre,
          password_hash,
          rol: 'admin',
          must_change_password: true,
        },
        select: { id: true, email: true, nombre: true, rol: true },
      });

      return { club, admin };
    });

    const mail = await this.mail.sendClubWelcome({
      to: adminEmail,
      clubNombre: created.club.nombre,
      slug,
      email: adminEmail,
      password,
      loginUrl: login_url,
    });

    return {
      club: created.club,
      admin: created.admin,
      credentials_once: {
        email: adminEmail,
        password,
        login_url,
      },
      mail,
    };
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
        ...(dto.precio_usd_mes !== undefined && {
          precio_usd_mes: dto.precio_usd_mes,
        }),
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
        must_change_password: false,
      },
      select: { id: true, email: true, nombre: true, rol: true },
    });
  }

  listPlatformAdmins() {
    return this.prisma.platformAdmin.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        email: true,
        nombre: true,
        activo: true,
        created_at: true,
      },
    });
  }

  async createPlatformAdmin(dto: CreatePlatformAdminDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.platformAdmin.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un superusuario con ese email');
    }
    const password_hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.platformAdmin.create({
      data: {
        email,
        nombre: dto.nombre.trim(),
        password_hash,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        activo: true,
        created_at: true,
      },
    });
  }

  async updatePlatformAdmin(
    id: number,
    dto: UpdatePlatformAdminDto,
    actorId: number,
  ) {
    const target = await this.prisma.platformAdmin.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Superusuario no encontrado');

    if (dto.activo === false) {
      if (id === actorId) {
        throw new BadRequestException('No podés desactivar tu propio usuario');
      }
      const activeCount = await this.prisma.platformAdmin.count({
        where: { activo: true },
      });
      if (target.activo && activeCount <= 1) {
        throw new BadRequestException('Tiene que quedar al menos un superusuario activo');
      }
    }

    return this.prisma.platformAdmin.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        ...(dto.password
          ? { password_hash: await bcrypt.hash(dto.password, 10) }
          : {}),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        activo: true,
        created_at: true,
      },
    });
  }

  private async uniqueSlug(base: string) {
    let slug = base;
    let n = 2;
    while (await this.prisma.club.findUnique({ where: { slug } })) {
      slug = `${base}-${n}`;
      n += 1;
    }
    return slug;
  }

  private async ensureClub(id: number) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) throw new NotFoundException('Club no encontrado');
    return club;
  }
}

