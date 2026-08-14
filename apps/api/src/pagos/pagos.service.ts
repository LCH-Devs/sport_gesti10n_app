import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { GenerarCobrosDto } from './dto/generar-cobros.dto';

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadoPagoService,
  ) {}

  private mesActual(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  async resumen(clubId: number, mes?: string) {
    const m = mes || this.mesActual();
    const pagos = await this.prisma.pago.findMany({
      where: { club_id: clubId, mes: m },
      include: {
        socio: {
          select: {
            id: true,
            dni: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const pagados = pagos.filter((p) => p.estado === 'pagado');
    const pendientes = pagos.filter((p) => p.estado === 'pendiente');

    return {
      mes: m,
      total: pagos.length,
      cantidad_pagados: pagados.length,
      cantidad_pendientes: pendientes.length,
      monto_pagado: pagados.reduce((s, p) => s + p.monto, 0),
      monto_pendiente: pendientes.reduce((s, p) => s + p.monto, 0),
      pagos,
    };
  }

  /**
   * Genera (o reutiliza) un Pago por socio activo y crea preference MP + link.
   * No envía push todavía (stub: devolver tokens pendientes = 0).
   */
  async generarYEnviar(clubId: number, dto: GenerarCobrosDto) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');

    const mes = dto.mes || this.mesActual();
    const monto = dto.monto ?? club.cuota_monto;

    const socios = await this.prisma.socio.findMany({
      where: { club_id: clubId, estado: 'activo' },
    });

    const resultados: Array<{
      socio_id: number;
      pago_id: number;
      link: string | null;
      creado: boolean;
    }> = [];

    for (const socio of socios) {
      let pago = await this.prisma.pago.findUnique({
        where: { socio_id_mes: { socio_id: socio.id, mes } },
      });

      let creado = false;
      if (!pago) {
        pago = await this.prisma.pago.create({
          data: {
            club_id: clubId,
            socio_id: socio.id,
            mes,
            monto,
            estado: 'pendiente',
          },
        });
        creado = true;
      }

      if (pago.estado === 'pagado' && pago.mp_init_point) {
        resultados.push({
          socio_id: socio.id,
          pago_id: pago.id,
          link: pago.mp_init_point,
          creado: false,
        });
        continue;
      }

      // Si ya tiene link y está pendiente, no regenerar salvo que no tenga
      if (!pago.mp_init_point || pago.estado === 'pendiente') {
        const pref = await this.mp.crearPreference({
          pagoId: pago.id,
          titulo: `Cuota ${mes} — ${club.nombre}`,
          monto: pago.monto,
          payerEmail: socio.email,
        });
        pago = await this.prisma.pago.update({
          where: { id: pago.id },
          data: {
            mp_preference_id: pref.preferenceId,
            mp_init_point: pref.initPoint,
            monto,
          },
        });
      }

      resultados.push({
        socio_id: socio.id,
        pago_id: pago.id,
        link: pago.mp_init_point,
        creado,
      });
    }

    return {
      mes,
      monto,
      socios_procesados: resultados.length,
      push_enviados: 0, // FCM en sprint siguiente
      message:
        'Links generados. Push FCM pendiente de configurar Firebase.',
      resultados,
    };
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
      // Sin token: en mock no hay lookup real
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
      // Reversión simple: vuelve a pendiente si no queremos perder el registro
      await this.prisma.pago.updateMany({
        where: { id: pagoId, estado: 'pagado' },
        data: { estado: 'pendiente', fecha_pago: null },
      });
    }

    return { ok: true, pago_id: pagoId, status };
  }
}
