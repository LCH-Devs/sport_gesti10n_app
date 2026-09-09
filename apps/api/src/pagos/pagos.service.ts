import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { flattenPerson, MEMBER_ROLES, NOT_DELETED, personInclude } from '../common/club-users';
import { GenerarCobrosDto } from './dto/generar-cobros.dto';
import { AltaCobrosFields } from './dto/alta-cobros.dto';
import {
  addMonthsYm,
  armarLotesCuota,
  estadoCuotaMes,
  mesActualYm,
  PAGO_TIPO_CUOTA,
  PAGO_TIPO_INSCRIPCION,
  splitMonto,
} from './cobros-cuota';

/** Acceso a delegados de cobro (funciona antes y después de `prisma generate`). */
function cobrosDb(db: object) {
  return db as {
    pago: {
      findUnique: (args: Record<string, unknown>) => Promise<any>;
      findMany: (args: Record<string, unknown>) => Promise<any[]>;
      create: (args: Record<string, unknown>) => Promise<any>;
      update: (args: Record<string, unknown>) => Promise<any>;
    };
    bonificacionCuota: {
      findMany: (args: Record<string, unknown>) => Promise<Array<{ socio_id: number }>>;
      upsert: (args: Record<string, unknown>) => Promise<any>;
    };
  };
}

export type AltaCobrosDb = object;

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadoPagoService,
  ) {}

  private mesActual(): string {
    return mesActualYm();
  }

  async resumen(clubId: number, mes?: string) {
    const m = mes || this.mesActual();
    const pagos = await cobrosDb(this.prisma).pago.findMany({
      where: { club_id: clubId, mes: m },
      include: {
        socio: { include: personInclude },
        grupo_familiar: { select: { id: true, nombre: true } },
      },
      orderBy: { id: 'asc' },
    });

    const mapped = pagos.map((p) => ({
      ...p,
      socio: flattenPerson(p.socio),
    }));

    const pagados = mapped.filter((p) => p.estado === 'pagado');
    const pendientes = mapped.filter((p) => p.estado === 'pendiente');

    return {
      mes: m,
      total: pagos.length,
      cantidad_pagados: pagados.length,
      cantidad_pendientes: pendientes.length,
      monto_pagado: pagados.reduce((s, p) => s + p.monto, 0),
      monto_pendiente: pendientes.reduce((s, p) => s + p.monto, 0),
      pagos: mapped,
    };
  }

  /** Snapshot de cuota del mes para el padrón (un pago por familia, al titular). */
  async estadoMes(clubId: number, mes?: string) {
    const m = mes || this.mesActual();
    const db = cobrosDb(this.prisma);
    const [socios, pagos, bonos] = await Promise.all([
      this.prisma.membresia.findMany({
        where: {
          club_id: clubId,
          rol: { in: [...MEMBER_ROLES] },
          ...NOT_DELETED,
        },
        select: {
          id: true,
          grupo_familiar_id: true,
          grupo_familiar: {
            select: { id: true, titular_id: true, eliminado: true },
          },
        },
      }),
      db.pago.findMany({
        where: { club_id: clubId, mes: m, tipo: PAGO_TIPO_CUOTA },
        select: {
          socio_id: true,
          monto: true,
          estado: true,
        },
      }),
      db.bonificacionCuota.findMany({
        where: { club_id: clubId, mes: m },
        select: { socio_id: true },
      }),
    ]);

    const pagoBySocio = new Map(
      pagos.map((p) => [p.socio_id as number, p]),
    );
    const bonoSet = new Set(bonos.map((b) => b.socio_id));

    const items = socios.map((s) => {
      const grupo =
        s.grupo_familiar && !s.grupo_familiar.eliminado
          ? s.grupo_familiar
          : null;
      const pagadorId = grupo ? grupo.titular_id : s.id;
      const pago = pagoBySocio.get(pagadorId);
      return {
        socio_id: s.id,
        grupo_familiar_id: grupo?.id ?? null,
        pagador_id: pagadorId,
        cuota_estado: estadoCuotaMes({
          pagoEstado: pago?.estado ?? null,
          bonificado: bonoSet.has(s.id),
        }),
        cuota_monto: pago?.monto ?? null,
      };
    });

    return { mes: m, items };
  }

  async cuenta(
    clubId: number,
    opts: { socioId?: number; familiaId?: number },
  ) {
    const socioId = opts.socioId;
    const familiaId = opts.familiaId;
    if ((socioId == null) === (familiaId == null)) {
      throw new BadRequestException(
        'Indicá socio_id o familia_id, no ambos',
      );
    }

    if (familiaId != null) {
      const grupo = await this.prisma.grupoFamiliar.findFirst({
        where: { id: familiaId, club_id: clubId, ...NOT_DELETED },
        include: {
          titular: { include: personInclude },
          socios: { where: NOT_DELETED, select: { id: true } },
        },
      });
      if (!grupo) throw new NotFoundException('Familia no encontrada');
      const memberIds = grupo.socios.map((m) => m.id);
      const pagos = await this.pagosDeCuenta(clubId, {
        grupoId: grupo.id,
        socioIds: memberIds,
      });
      return {
        tipo: 'familia' as const,
        familia: {
          id: grupo.id,
          nombre: grupo.nombre,
          titular: flattenPerson(grupo.titular),
        },
        pagos,
      };
    }

    const socio = await this.prisma.membresia.findFirst({
      where: { id: socioId, club_id: clubId, ...NOT_DELETED },
      include: {
        ...personInclude,
        grupo_familiar: {
          select: { id: true, nombre: true, titular_id: true, eliminado: true },
        },
      },
    });
    if (!socio) throw new NotFoundException('Socio no encontrado');
    const grupo =
      socio.grupo_familiar && !socio.grupo_familiar.eliminado
        ? socio.grupo_familiar
        : null;
    const pagos = await this.pagosDeCuenta(clubId, {
      grupoId: grupo?.id,
      socioIds: [socio.id],
    });
    return {
      tipo: 'socio' as const,
      socio: flattenPerson(socio),
      familia: grupo
        ? { id: grupo.id, nombre: grupo.nombre, titular_id: grupo.titular_id }
        : null,
      pagos,
    };
  }

  private async pagosDeCuenta(
    clubId: number,
    opts: { grupoId?: number; socioIds: number[] },
  ) {
    const or: Array<Record<string, unknown>> = [];
    if (opts.grupoId != null) {
      or.push({ grupo_familiar_id: opts.grupoId });
    }
    if (opts.socioIds.length) {
      or.push({ socio_id: { in: opts.socioIds } });
    }
    const pagos = await cobrosDb(this.prisma).pago.findMany({
      where: { club_id: clubId, OR: or },
      include: {
        socio: { include: personInclude },
        grupo_familiar: { select: { id: true, nombre: true } },
      },
      orderBy: [{ mes: 'desc' }, { id: 'desc' }],
    });
    return pagos.map((p) => ({
      ...p,
      socio: flattenPerson(p.socio),
    }));
  }

  /**
   * Un pago de cuota por socio suelto, o uno solo al titular si hay familia.
   * Aplica descuento_familiar_pct y saltea meses bonificados.
   */
  async generarYEnviar(clubId: number, dto: GenerarCobrosDto) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');

    const mes = dto.mes || this.mesActual();
    const overrideMonto = dto.monto;

    const db = cobrosDb(this.prisma);
    const [socios, bonos] = await Promise.all([
      this.prisma.membresia.findMany({
        where: {
          club_id: clubId,
          estado: 'activo',
          rol: { in: [...MEMBER_ROLES] },
          ...NOT_DELETED,
        },
        include: {
          usuario: { select: { email: true } },
          categoria: { select: { monto: true } },
          grupo_familiar: {
            select: { id: true, nombre: true, titular_id: true, eliminado: true },
          },
        },
      }),
      db.bonificacionCuota.findMany({
        where: { club_id: clubId, mes },
        select: { socio_id: true },
      }),
    ]);

    const lotes = armarLotesCuota(
      socios.map((socio) => {
        const grupo =
          socio.grupo_familiar && !socio.grupo_familiar.eliminado
            ? socio.grupo_familiar
            : null;
        return {
          id: socio.id,
          email: socio.usuario.email,
          grupo_familiar_id: grupo?.id ?? null,
          grupo_nombre: grupo?.nombre ?? null,
          titular_id: grupo?.titular_id ?? null,
          monto: socio.categoria?.monto ?? club.cuota_monto,
        };
      }),
      {
        mes,
        overrideMonto,
        descuentoFamiliarPct: club.descuento_familiar_pct ?? 0,
        bonificados: new Set(bonos.map((b) => b.socio_id)),
      },
    );

    const resultados: Array<{
      socio_id: number;
      pago_id: number;
      link: string | null;
      creado: boolean;
      concepto: string;
    }> = [];

    for (const lote of lotes) {
      let pago = await db.pago.findUnique({
        where: {
          socio_id_mes_tipo: {
            socio_id: lote.socio_id,
            mes,
            tipo: PAGO_TIPO_CUOTA,
          },
        },
      });

      let creado = false;
      if (!pago) {
        pago = await db.pago.create({
          data: {
            club_id: clubId,
            socio_id: lote.socio_id,
            grupo_familiar_id: lote.grupo_familiar_id,
            tipo: PAGO_TIPO_CUOTA,
            concepto: lote.concepto,
            mes,
            monto: lote.monto,
            estado: 'pendiente',
          },
        });
        creado = true;
      }

      if (pago.estado === 'pagado' && pago.mp_init_point) {
        resultados.push({
          socio_id: lote.socio_id,
          pago_id: pago.id,
          link: pago.mp_init_point,
          creado: false,
          concepto: pago.concepto || lote.concepto,
        });
        continue;
      }

      if (pago.estado === 'pendiente') {
        pago = await db.pago.update({
          where: { id: pago.id },
          data: {
            monto: lote.monto,
            concepto: lote.concepto,
            grupo_familiar_id: lote.grupo_familiar_id,
          },
        });
      }

      await this.asegurarLink(pago.id, {
        titulo: `${lote.concepto} — ${club.nombre}`,
        monto: pago.monto,
        payerEmail: lote.payerEmail,
      });
      const refreshed = await db.pago.findUnique({
        where: { id: pago.id },
      });

      resultados.push({
        socio_id: lote.socio_id,
        pago_id: pago.id,
        link: refreshed?.mp_init_point ?? null,
        creado,
        concepto: lote.concepto,
      });
    }

    return {
      mes,
      monto: overrideMonto ?? club.cuota_monto,
      socios_procesados: resultados.length,
      push_enviados: 0,
      message:
        'Links generados. Push FCM pendiente de configurar Firebase.',
      resultados,
    };
  }

  /**
   * Escribe bonificaciones e inscripción dentro de la misma transacción del alta.
   * Sin link MP (eso va después del commit).
   */
  async persistirAlta(
    db: AltaCobrosDb,
    clubId: number,
    socioId: number,
    dto: AltaCobrosFields,
  ) {
    const meses = [...new Set(dto.bonificar_meses || [])];
    const cobraInsc =
      dto.inscripcion === true &&
      dto.inscripcion_monto != null &&
      dto.inscripcion_monto > 0;

    if (!meses.length && !cobraInsc) return;

    const cx = cobrosDb(db);
    for (const mes of meses) {
      await cx.bonificacionCuota.upsert({
        where: { socio_id_mes: { socio_id: socioId, mes } },
        create: { club_id: clubId, socio_id: socioId, mes },
        update: {},
      });
    }

    if (!cobraInsc || dto.inscripcion_monto == null) return;

    const partes = splitMonto(
      dto.inscripcion_monto,
      dto.inscripcion_cuotas ?? 1,
    );
    const desde = this.mesActual();
    for (let i = 0; i < partes.length; i++) {
      const mes = addMonthsYm(desde, i);
      const existing = await cx.pago.findUnique({
        where: {
          socio_id_mes_tipo: {
            socio_id: socioId,
            mes,
            tipo: PAGO_TIPO_INSCRIPCION,
          },
        },
      });
      if (existing) continue;
      await cx.pago.create({
        data: {
          club_id: clubId,
          socio_id: socioId,
          tipo: PAGO_TIPO_INSCRIPCION,
          concepto: `Inscripción ${i + 1}/${partes.length}`,
          mes,
          monto: partes[i],
          estado: 'pendiente',
        },
      });
    }
  }

  async generarLinksDeAlta(clubId: number, socioIds: number[]) {
    if (socioIds.length === 0) return;
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { nombre: true },
    });
    if (!club) return;

    const pagos = await cobrosDb(this.prisma).pago.findMany({
      where: {
        club_id: clubId,
        socio_id: { in: socioIds },
        tipo: PAGO_TIPO_INSCRIPCION,
        estado: 'pendiente',
        mp_init_point: null,
      },
      include: {
        socio: { include: { usuario: { select: { email: true } } } },
      },
    });

    for (const pago of pagos) {
      try {
        await this.asegurarLink(pago.id, {
          titulo: `${pago.concepto || 'Inscripción'} — ${club.nombre}`,
          monto: pago.monto,
          payerEmail: pago.socio.usuario.email,
        });
      } catch {
        // El alta ya está; el link se puede completar después.
      }
    }
  }

  private async asegurarLink(
    pagoId: number,
    opts: { titulo: string; monto: number; payerEmail: string },
  ) {
    const pref = await this.mp.crearPreference({
      pagoId,
      titulo: opts.titulo,
      monto: opts.monto,
      payerEmail: opts.payerEmail,
    });
    await this.prisma.pago.update({
      where: { id: pagoId },
      data: {
        mp_preference_id: pref.preferenceId,
        mp_init_point: pref.initPoint,
      },
    });
  }

  async marcarManual(clubId: number, pagoId: number) {
    const pago = await this.prisma.pago.findFirst({
      where: { id: pagoId, club_id: clubId },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');
    if (pago.estado === 'pagado') {
      return pago;
    }
    return this.prisma.pago.update({
      where: { id: pagoId },
      data: { estado: 'pagado', fecha_pago: new Date() },
    });
  }

  /**
   * Webhook MP: consulta el pago y marca según status.
   * Validación de firma x-signature: pendiente de secret en prod (ver security_issues).
   */
  async handleWebhook(body: {
    type?: string;
    action?: string;
    data?: { id?: string };
  }) {
    const paymentId = body?.data?.id;
    if (!paymentId) {
      return { ok: true, skipped: true };
    }

    const payment = await this.mp.obtenerPago(String(paymentId));
    if (!payment) {
      return { ok: true, mock: true };
    }

    const ref = payment.external_reference;
    if (!ref) {
      throw new BadRequestException('Pago sin external_reference');
    }
    const pagoId = Number(ref);
    if (Number.isNaN(pagoId)) {
      throw new BadRequestException('external_reference inválido');
    }

    const status = payment.status;
    if (status === 'approved') {
      await this.prisma.pago.updateMany({
        where: { id: pagoId },
        data: { estado: 'pagado', fecha_pago: new Date() },
      });
    } else if (
      status === 'cancelled' ||
      status === 'rejected' ||
      status === 'refunded' ||
      status === 'charged_back'
    ) {
      await this.prisma.pago.updateMany({
        where: { id: pagoId, estado: 'pagado' },
        data: { estado: 'pendiente', fecha_pago: null },
      });
    }

    return { ok: true, pago_id: pagoId, status };
  }
}
