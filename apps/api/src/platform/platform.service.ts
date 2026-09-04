import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CreateClubAdminDto,
  CreateClubPlatformDto,
  CreatePlatformAdminDto,
  UpdateClubPlatformDto,
  UpdatePlatformAdminDto,
  UpdateSelfPlatformAdminDto,
} from './dto/platform.dto';
import { NOT_DELETED, adminEmailInUseWhere, clubNombreInUseWhere, CLUB_NOMBRE_TAKEN } from '../common/club-users';
import { normalizeDeportes } from '../common/club-deportes';
import {
  isReservedTenantSlug,
  staffPanelLoginUrl,
} from '../common/tenant-host';

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
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const num = '23456789';
  const spec = '!@#$%&*_+=-';
  const all = lower + upper + num + spec;
  const pick = (s: string) => s[randomInt(s.length)];
  const chars = [pick(lower), pick(upper), pick(num), pick(spec)];
  for (let i = 0; i < 8; i++) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async listClubs() {
    const clubs = await this.prisma.club.findMany({
      where: { eliminado: false },
      orderBy: { nombre: 'asc' },
      include: {
        membresias: {
          where: NOT_DELETED,
          include: { usuario: { select: { email: true, nombre: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });
    return clubs.map((club) => this.shapeClub(club));
  }

  async getClub(id: number) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        membresias: {
          where: NOT_DELETED,
          include: { usuario: { select: { email: true, nombre: true } } },
          orderBy: { id: 'asc' },
        },
        _count: { select: { pagos: true } },
      },
    });
    if (!club || club.eliminado) throw new NotFoundException('Club no encontrado');
    return this.shapeClub(club);
  }

  /** Lecturas del superadmin, aisladas de los endpoints mutables del club. */
  async getClubResource(id: number, resource: string) {
    await this.ensureClub(id);
    switch (resource) {
      case 'socios':
        return this.prisma.membresia.findMany({ where: { club_id: id, rol: { in: ['socio', 'profe'] }, eliminado: false }, include: { usuario: true }, orderBy: { id: 'asc' } });
      case 'usuarios':
        return this.prisma.membresia.findMany({ where: { club_id: id, rol: { in: ['admin', 'entrada'] }, eliminado: false }, include: { usuario: { select: { email: true, nombre: true } } }, orderBy: { id: 'asc' } });
      case 'familias':
        return this.prisma.grupoFamiliar.findMany({ where: { club_id: id, eliminado: false }, include: { titular: { include: { usuario: true } }, socios: true }, orderBy: { id: 'asc' } });
      case 'actividades': return this.prisma.actividad.findMany({ where: { club_id: id, eliminado: false }, orderBy: { nombre: 'asc' } });
      case 'espacios': return this.prisma.espacio.findMany({ where: { club_id: id, eliminado: false }, orderBy: { nombre: 'asc' } });
      case 'horarios': return this.prisma.horario.findMany({ where: { club_id: id, eliminado: false }, orderBy: { id: 'asc' } });
      case 'reservas': return this.prisma.reserva.findMany({ where: { club_id: id }, include: { espacio: true, socio: { include: { usuario: true } } }, orderBy: { inicio: 'desc' } });
      case 'noticias': return this.prisma.noticia.findMany({ where: { club_id: id, eliminado: false }, orderBy: { fecha: 'desc' } });
      case 'torneos': return this.prisma.torneo.findMany({ where: { club_id: id }, include: { _count: { select: { partidos: true } } }, orderBy: { id: 'desc' } });
      case 'liquidaciones': return this.prisma.liquidacionProfe.findMany({ where: { club_id: id }, include: { profe: { include: { usuario: true } } }, orderBy: { mes: 'desc' } });
      case 'cobros': return this.prisma.pago.findMany({ where: { club_id: id }, include: { socio: { include: { usuario: true } } }, orderBy: { mes: 'desc' } });
      default: throw new NotFoundException('Recurso de lectura no encontrado');
    }
  }

  async createClub(dto: CreateClubPlatformDto) {
    const slug = await this.uniqueSlug(slugify(dto.nombre));
    const password = randomPassword();
    const password_hash = await bcrypt.hash(password, 10);
    const adminEmail = dto.admin_email.toLowerCase().trim();
    const taken = await this.prisma.membresia.findFirst({
      where: adminEmailInUseWhere(adminEmail),
    });
    if (taken) {
      throw new BadRequestException(
        'Ese email ya administra un club. La comisión no se comparte entre clubes.',
      );
    }
    const nombreTaken = await this.prisma.club.findFirst({
      where: clubNombreInUseWhere(dto.nombre),
    });
    if (nombreTaken) {
      throw new BadRequestException(CLUB_NOMBRE_TAKEN);
    }
    const adminNombre = dto.admin_nombre?.trim() || 'Admin';
    const login_url = this.panelLoginUrl();

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

      const existingUser = await tx.usuario.findUnique({
        where: { email: adminEmail },
      });
      const usuario = existingUser
        ? await tx.usuario.update({
            where: { id: existingUser.id },
            data: {
              password_hash,
              nombre: adminNombre,
            },
          })
        : await tx.usuario.create({
            data: {
              email: adminEmail,
              nombre: adminNombre,
              password_hash,
            },
          });

      const adminRow = await tx.membresia.create({
        data: {
          usuario_id: usuario.id,
          club_id: club.id,
          rol: 'admin',
          must_change_password: true,
        },
        include: { usuario: { select: { email: true, nombre: true } } },
      });

      return {
        club,
        admin: {
          id: adminRow.id,
          email: adminRow.usuario.email,
          nombre: adminRow.usuario.nombre,
          rol: adminRow.rol,
        },
      };
    });

    const mail = await this.mail.sendClubWelcome({
      to: adminEmail,
      clubNombre: created.club.nombre,
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
    const club = await this.ensureClub(id);
    if (dto.nombre !== undefined) {
      const nombreTaken = await this.prisma.club.findFirst({
        where: clubNombreInUseWhere(dto.nombre, id),
      });
      if (nombreTaken) {
        throw new BadRequestException(CLUB_NOMBRE_TAKEN);
      }
    }
    const wasActive = club.activo;
    const updated = await this.prisma.club.update({
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
        ...(dto.deportes !== undefined && {
          deportes: normalizeDeportes(dto.deportes),
        }),
        ...(dto.descuento_familiar_pct !== undefined && {
          descuento_familiar_pct: dto.descuento_familiar_pct,
        }),
      },
    });

    if (dto.activo === false && wasActive) {
      const admin = await this.primaryAdmin(id);
      const mail = admin
        ? await this.mail.sendClubSuspended({
            to: admin.usuario.email,
            clubNombre: updated.nombre,
          })
        : undefined;
      return { ...updated, mail };
    }

    if (dto.activo === true && !wasActive) {
      const reset = await this.resetAdminPasswordForReactivation(id);
      const login_url = this.panelLoginUrl();
      const mail = reset
        ? await this.mail.sendClubReactivated({
            to: reset.email,
            clubNombre: updated.nombre,
            email: reset.email,
            password: reset.password,
            loginUrl: login_url,
          })
        : undefined;
      return {
        ...updated,
        credentials_once: reset
          ? { email: reset.email, password: reset.password, login_url }
          : undefined,
        mail,
      };
    }

    return updated;
  }

  async deleteClub(id: number) {
    const club = await this.ensureClub(id);
    const admin = await this.primaryAdmin(id);
    await this.prisma.$transaction([
      this.prisma.membresia.updateMany({
        where: { club_id: id, eliminado: false },
        data: { eliminado: true },
      }),
      this.prisma.club.update({
        where: { id },
        data: {
          activo: false,
          eliminado: true,
          slug: `${club.slug}__del${id}`,
        },
      }),
    ]);
    const mail = admin
      ? await this.mail.sendClubDeleted({
          to: admin.usuario.email,
          clubNombre: club.nombre,
        })
      : undefined;
    return { deleted: true, id, mail };
  }

  async addAdmin(clubId: number, dto: CreateClubAdminDto) {
    await this.ensureClub(clubId);
    const email = dto.email.toLowerCase().trim();
    if (dto.rol !== 'entrada') {
      const existingAdmin = await this.prisma.membresia.findFirst({
        where: adminEmailInUseWhere(email),
      });
      if (existingAdmin) {
        throw new BadRequestException(
          'Ese email ya administra un club. La comisión no se comparte entre clubes.',
        );
      }
    }
    const password_hash = await bcrypt.hash(dto.password, 10);
    const usuario = await this.prisma.usuario.upsert({
      where: { email },
      update: { nombre: dto.nombre.trim(), password_hash },
      create: {
        email,
        nombre: dto.nombre.trim(),
        password_hash,
      },
    });
    const already = await this.prisma.membresia.findUnique({
      where: { usuario_id_club_id: { usuario_id: usuario.id, club_id: clubId } },
    });
    if (already && !already.eliminado) {
      throw new BadRequestException('Ese usuario ya está en este club');
    }
    if (already?.eliminado) {
      const restored = await this.prisma.membresia.update({
        where: { id: already.id },
        data: {
          eliminado: false,
          rol: dto.rol === 'entrada' ? 'entrada' : 'admin',
          must_change_password: false,
        },
        include: { usuario: { select: { email: true, nombre: true } } },
      });
      return {
        id: restored.id,
        email: restored.usuario.email,
        nombre: restored.usuario.nombre,
        rol: restored.rol,
      };
    }
    const row = await this.prisma.membresia.create({
      data: {
        usuario_id: usuario.id,
        club_id: clubId,
        rol: dto.rol === 'entrada' ? 'entrada' : 'admin',
        must_change_password: false,
      },
      include: { usuario: { select: { email: true, nombre: true } } },
    });
    return {
      id: row.id,
      email: row.usuario.email,
      nombre: row.usuario.nombre,
      rol: row.rol,
    };
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

  async getSelf(id: number) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id },
      select: { id: true, email: true, nombre: true, activo: true, created_at: true },
    });
    if (!admin) throw new NotFoundException('Superusuario no encontrado');
    return admin;
  }

  async updateSelf(id: number, dto: UpdateSelfPlatformAdminDto) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Superusuario no encontrado');

    let password_hash: string | undefined;
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Ingresá tu contraseña actual');
      }
      const ok = await bcrypt.compare(dto.currentPassword, admin.password_hash);
      if (!ok) {
        throw new BadRequestException('Contraseña actual incorrecta');
      }
      password_hash = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.prisma.platformAdmin.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(password_hash && { password_hash }),
      },
      select: { id: true, email: true, nombre: true, activo: true, created_at: true },
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

  private panelLoginUrl() {
    const webUrl =
      this.config.get<string>('WEB_APP_URL') || 'http://localhost:3000';
    return staffPanelLoginUrl(webUrl);
  }

  private primaryAdmin(clubId: number) {
    return this.prisma.membresia.findFirst({
      where: { club_id: clubId, rol: 'admin', ...NOT_DELETED },
      include: { usuario: { select: { id: true, email: true } } },
      orderBy: { id: 'asc' },
    });
  }

  private async resetAdminPasswordForReactivation(clubId: number) {
    const admin = await this.primaryAdmin(clubId);
    if (!admin) return null;
    const password = randomPassword();
    const password_hash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: admin.usuario.id },
        data: { password_hash },
      }),
      this.prisma.membresia.update({
        where: { id: admin.id },
        data: { must_change_password: true },
      }),
    ]);
    return { email: admin.usuario.email, password };
  }

  private async uniqueSlug(base: string) {
    let slug = isReservedTenantSlug(base) ? `${base}-club` : base;
    let n = 2;
    while (
      isReservedTenantSlug(slug) ||
      (await this.prisma.club.findUnique({ where: { slug } }))
    ) {
      slug = `${base}-${n}`;
      n += 1;
    }
    return slug;
  }

  private shapeClub(club: {
    membresias: Array<{
      id: number;
      rol: string;
      usuario: { email: string; nombre: string };
    }>;
    _count?: { pagos?: number };
    [key: string]: unknown;
  }) {
    const staff = club.membresias.filter(
      (m) => m.rol === 'admin' || m.rol === 'entrada',
    );
    const socios = club.membresias.filter(
      (m) => m.rol === 'socio' || m.rol === 'profe',
    );
    const { membresias: _membresias, _count, ...rest } = club;
    return {
      ...rest,
      admins: staff.map((m) => ({
        id: m.id,
        email: m.usuario.email,
        nombre: m.usuario.nombre,
        rol: m.rol,
      })),
      _count: {
        socios: socios.length,
        admins: staff.length,
        pagos: _count?.pagos ?? 0,
      },
    };
  }

  private async ensureClub(id: number) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club || club.eliminado) throw new NotFoundException('Club no encontrado');
    return club;
  }
}
