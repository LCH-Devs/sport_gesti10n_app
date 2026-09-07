import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { MEMBER_ROLES, NOT_DELETED } from '../common/club-users';
import {
  DEFAULT_PLAN_TRAMOS,
  PLAN_UPGRADE_REQUIRED,
  PlanTramoRow,
  PlanUpgradePayload,
  proximoCiclo,
  proximoTramo,
  topeEfectivo,
  tramoParaCantidad,
  tramoPorHasta,
  validateTramos,
} from '../common/plan-saas';

type ClubPlanDb = {
  club: PrismaService['club'];
  membresia: PrismaService['membresia'];
  planTramo: PrismaService['planTramo'];
};

@Injectable()
export class PlanSaaSService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async listTramos() {
    const rows = await this.prisma.planTramo.findMany({
      orderBy: { orden: 'asc' },
    });
    if (rows.length) return rows;
    return this.replaceTramos(DEFAULT_PLAN_TRAMOS);
  }

  async replaceTramos(input: PlanTramoRow[]) {
    let validated: PlanTramoRow[];
    try {
      validated = validateTramos(input);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Planes inválidos',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.planTramo.deleteMany();
      await tx.planTramo.createMany({
        data: validated.map((t) => ({
          nombre: t.nombre,
          desde: t.desde,
          hasta: t.hasta,
          precio_usd: t.precio_usd,
          orden: t.orden,
        })),
      });
    });
    return this.prisma.planTramo.findMany({ orderBy: { orden: 'asc' } });
  }

  async assignForCantidad(cantidad: number) {
    const tramos = await this.listTramos();
    const tramo = tramoParaCantidad(tramos, cantidad);
    return {
      plan: tramo.nombre,
      precio_usd_mes: tramo.precio_usd,
      plan_hasta: topeEfectivo(tramo.hasta),
      plan_consentido_hasta: topeEfectivo(tramo.hasta),
    };
  }

  async previewForCantidad(cantidad: number) {
    return this.assignForCantidad(cantidad);
  }

  async usoDelClub(clubId: number) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club || club.eliminado) {
      throw new NotFoundException('Club no encontrado');
    }
    const socios_activos = await this.countSocios(this.prisma, clubId);
    const tramos = await this.listTramos();
    const actual = tramoPorHasta(tramos, club.plan_hasta);
    const siguiente = proximoTramo(tramos, actual);
    const pendiente = Boolean(club.plan_pendiente_precio);
    const confirmado = Boolean(club.plan_pendiente_confirmado_at);
    const pct = club.plan_hasta
      ? Math.round((socios_activos / club.plan_hasta) * 100)
      : 0;
    return {
      socios_activos,
      plan: club.plan,
      plan_hasta: club.plan_hasta,
      precio_usd_mes: club.precio_usd_mes,
      pct,
      alerta: pendiente && !confirmado ? 'pendiente' : pct >= 100 ? 'lleno' : pct >= 80 ? 'alto' : 'ok',
      siguiente: siguiente
        ? {
            nombre: siguiente.nombre,
            precio_usd: siguiente.precio_usd,
            hasta: siguiente.hasta,
            faltan: Math.max(0, club.plan_hasta - socios_activos),
          }
        : null,
      pendiente: pendiente
        ? {
            precio: club.plan_pendiente_precio,
            hasta: club.plan_pendiente_hasta,
            en_at: club.plan_pendiente_en_at,
            confirmado,
            aplica_desde: club.plan_pendiente_aplica_desde,
            mail_enviado_at: club.plan_pendiente_mail_enviado_at,
          }
        : null,
    };
  }

  async assertCanAddMembers(
    db: ClubPlanDb,
    clubId: number,
    extras: number,
    aceptaUpgrade?: boolean,
  ) {
    if (extras <= 0) return;
    const club = await db.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');
    const actuales = await this.countSocios(db, clubId);
    const proyectados = actuales + extras;
    if (proyectados <= club.plan_hasta) return;
    if (proyectados <= club.plan_consentido_hasta) return;

    const tramos = await db.planTramo.findMany({ orderBy: { orden: 'asc' } });
    const list = tramos.length ? tramos : DEFAULT_PLAN_TRAMOS;
    const actual = tramoPorHasta(list, club.plan_hasta);
    const siguiente = proximoTramo(list, actual);
    if (!siguiente) {
      throw new BadRequestException('No hay un plan superior para esa cantidad');
    }
    const aplica = proximoCiclo();
    if (!aceptaUpgrade) {
      const payload: PlanUpgradePayload = {
        code: PLAN_UPGRADE_REQUIRED,
        socios_actuales: actuales,
        extras,
        plan_hasta: club.plan_hasta,
        plan_nombre: club.plan,
        precio_actual: club.precio_usd_mes,
        precio_proximo: siguiente.precio_usd,
        hasta_proximo: siguiente.hasta,
        plan_proximo_nombre: siguiente.nombre,
        aplica_desde: aplica.toISOString().slice(0, 10),
      };
      throw new ConflictException({
        statusCode: 409,
        message: `Este mes sigue en ${club.plan} (USD ${club.precio_usd_mes}). El próximo ciclo pasaría a ${siguiente.nombre} (USD ${siguiente.precio_usd}).`,
        ...payload,
      });
    }

    const samePending =
      club.plan_pendiente_hasta === topeEfectivo(siguiente.hasta) &&
      club.plan_pendiente_precio === siguiente.precio_usd;
    const token = randomBytes(32).toString('hex');
    await db.club.update({
      where: { id: clubId },
      data: {
        plan_consentido_hasta: topeEfectivo(siguiente.hasta),
        ...(samePending
          ? {}
          : {
              plan_pendiente_precio: siguiente.precio_usd,
              plan_pendiente_hasta: topeEfectivo(siguiente.hasta),
              plan_pendiente_en_at: new Date(),
              plan_pendiente_confirmado_at: null,
              plan_pendiente_aplica_desde: aplica,
              plan_pendiente_token_hash: hashToken(token),
              plan_pendiente_mail_enviado_at: null,
            }),
      },
    });
    if (!samePending) {
      await this.sendUpgradeMail(clubId, token);
    }
  }

  async confirmarClub(clubId: number) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club || club.eliminado) {
      throw new NotFoundException('Club no encontrado');
    }
    if (!club.plan_pendiente_precio) {
      throw new BadRequestException('Este club no tiene un upgrade pendiente');
    }
    if (club.plan_pendiente_confirmado_at) {
      return this.usoDelClub(clubId);
    }
    await this.prisma.club.update({
      where: { id: clubId },
      data: {
        plan_pendiente_confirmado_at: new Date(),
        plan_pendiente_aplica_desde:
          club.plan_pendiente_aplica_desde ?? proximoCiclo(),
      },
    });
    return this.usoDelClub(clubId);
  }

  async confirmarPorToken(token: string) {
    const hash = hashToken(token);
    const club = await this.prisma.club.findFirst({
      where: { plan_pendiente_token_hash: hash, eliminado: false },
    });
    if (!club) {
      throw new NotFoundException('El enlace no es válido o ya se usó');
    }
    return this.confirmarClub(club.id);
  }

  async reenviarMail(clubId: number) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club || club.eliminado) {
      throw new NotFoundException('Club no encontrado');
    }
    if (!club.plan_pendiente_precio || club.plan_pendiente_confirmado_at) {
      throw new BadRequestException('No hay un upgrade pendiente para reenviar');
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.club.update({
      where: { id: clubId },
      data: {
        plan_pendiente_token_hash: hashToken(token),
        plan_pendiente_mail_enviado_at: null,
      },
    });
    return this.sendUpgradeMail(clubId, token);
  }

  async aplicarVencidos() {
    const now = new Date();
    const clubs = await this.prisma.club.findMany({
      where: {
        eliminado: false,
        plan_pendiente_confirmado_at: { not: null },
        plan_pendiente_aplica_desde: { lte: now },
        plan_pendiente_precio: { not: null },
      },
    });
    let aplicados = 0;
    for (const club of clubs) {
      const tramos = await this.listTramos();
      const tramo = tramoPorHasta(tramos, club.plan_pendiente_hasta ?? club.plan_hasta);
      await this.prisma.club.update({
        where: { id: club.id },
        data: {
          precio_usd_mes: club.plan_pendiente_precio ?? club.precio_usd_mes,
          plan_hasta: club.plan_pendiente_hasta ?? club.plan_hasta,
          plan: tramo.nombre,
          plan_consentido_hasta: club.plan_pendiente_hasta ?? club.plan_hasta,
          plan_pendiente_precio: null,
          plan_pendiente_hasta: null,
          plan_pendiente_en_at: null,
          plan_pendiente_mail_enviado_at: null,
          plan_pendiente_confirmado_at: null,
          plan_pendiente_aplica_desde: null,
          plan_pendiente_token_hash: null,
        },
      });
      aplicados += 1;
    }
    return { revisados: clubs.length, aplicados };
  }

  async listPendientesSinConfirmar() {
    const clubs = await this.prisma.club.findMany({
      where: {
        eliminado: false,
        activo: true,
        plan_pendiente_precio: { not: null },
        plan_pendiente_confirmado_at: null,
      },
      orderBy: { plan_pendiente_en_at: 'asc' },
    });
    const rows = await Promise.all(
      clubs.map(async (club) => {
        const socios = await this.countSocios(this.prisma, club.id);
        return {
          id: club.id,
          nombre: club.nombre,
          slug: club.slug,
          ciudad: club.ciudad,
          provincia: club.provincia,
          socios_activos: socios,
          plan: club.plan,
          plan_hasta: club.plan_hasta,
          precio_usd_mes: club.precio_usd_mes,
          pendiente_precio: club.plan_pendiente_precio,
          pendiente_hasta: club.plan_pendiente_hasta,
          pendiente_en_at: club.plan_pendiente_en_at,
          mail_enviado_at: club.plan_pendiente_mail_enviado_at,
        };
      }),
    );
    return rows;
  }

  async resumenPlataforma() {
    const [clubs, solicitudes, pendientes] = await Promise.all([
      this.prisma.club.findMany({
        where: { eliminado: false },
        select: {
          id: true,
          activo: true,
          plan_hasta: true,
          plan_pendiente_precio: true,
          plan_pendiente_confirmado_at: true,
        },
      }),
      this.prisma.solicitud.count({
        where: { eliminado: false, estado: 'pendiente' },
      }),
      this.listPendientesSinConfirmar(),
    ]);
    const activos = clubs.filter((c) => c.activo);
    const counts = await Promise.all(
      activos.map((c) => this.countSocios(this.prisma, c.id)),
    );
    const socios_totales = counts.reduce((a, b) => a + b, 0);
    return {
      clubs_activos: activos.length,
      clubs_totales: clubs.length,
      socios_totales,
      solicitudes_pendientes: solicitudes,
      planes_sin_confirmar: pendientes.length,
    };
  }

  private async countSocios(db: ClubPlanDb, clubId: number) {
    return db.membresia.count({
      where: {
        club_id: clubId,
        rol: { in: [...MEMBER_ROLES] },
        ...NOT_DELETED,
      },
    });
  }

  private async sendUpgradeMail(clubId: number, token: string) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return { sent: false };
    const admin = await this.prisma.membresia.findFirst({
      where: { club_id: clubId, rol: 'admin', ...NOT_DELETED },
      include: { usuario: { select: { email: true, nombre: true } } },
      orderBy: { id: 'asc' },
    });
    if (!admin) return { sent: false };
    const webUrl = (
      this.config.get<string>('WEB_APP_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const confirmUrl = `${webUrl}/supercalifragilisticoespiralidoso/plan/confirmar?token=${token}`;
    const mail = await this.mail.sendPlanUpgradePending({
      to: admin.usuario.email,
      adminNombre: admin.usuario.nombre,
      clubNombre: club.nombre,
      planActual: club.plan,
      precioActual: club.precio_usd_mes,
      planNuevo: (
        await this.listTramos()
      ).find((t) => topeEfectivo(t.hasta) === club.plan_pendiente_hasta)?.nombre ||
        'plan superior',
      precioNuevo: club.plan_pendiente_precio ?? 0,
      aplicaDesde: (club.plan_pendiente_aplica_desde ?? proximoCiclo())
        .toISOString()
        .slice(0, 10),
      confirmUrl,
    });
    await this.prisma.club.update({
      where: { id: clubId },
      data: { plan_pendiente_mail_enviado_at: new Date() },
    });
    return mail;
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
