import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DIA_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;

function mesActual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function whatsappUrl(telefono: string, mensaje: string): string | null {
  const digits = telefono.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
}

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async hoy(clubId: number) {
    const mes = mesActual();
    const now = new Date();
    const diaKey = DIA_KEYS[now.getDay()];
    const desde = startOfDay(now);
    const hasta = endOfDay(now);

    const [pagosMes, reservasHoy, horarios, club] = await Promise.all([
      this.prisma.pago.findMany({
        where: { club_id: clubId, mes },
        include: {
          socio: {
            select: {
              id: true,
              dni: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      this.prisma.reserva.findMany({
        where: {
          club_id: clubId,
          estado: 'confirmada',
          inicio: { gte: desde, lte: hasta },
        },
        include: {
          socio: {
            select: { id: true, nombre: true, apellido: true, dni: true },
          },
          espacio: { select: { id: true, nombre: true } },
        },
        orderBy: { inicio: 'asc' },
      }),
      this.prisma.horario.findMany({
        where: { club_id: clubId, activo: true },
      }),
      this.prisma.club.findUnique({ where: { id: clubId } }),
    ]);

    if (!club) throw new NotFoundException('Club no encontrado');

    const total = pagosMes.length;
    const pagados = pagosMes.filter((p) => p.estado === 'pagado').length;
    const pendientes = pagosMes.filter((p) => p.estado === 'pendiente').length;
    const pct_cobrado = total === 0 ? 0 : Math.round((pagados / total) * 10000) / 100;

    const deudores = pagosMes
      .filter((p) => p.estado === 'pendiente')
      .map((p) => ({
        id: p.socio.id,
        dni: p.socio.dni,
        nombre: p.socio.nombre,
        apellido: p.socio.apellido,
        monto: p.monto,
      }));

    const horarios_hoy = horarios.filter((h) => {
      const dias = h.dias.toLowerCase();
      return dias.includes(diaKey);
    });

    const alerta = await this.alertaFuga(clubId);

    return {
      mes,
      cobranza: {
        total,
        pagados,
        pendientes,
        pct_cobrado,
      },
      deudores,
      reservas_hoy: reservasHoy,
      horarios_hoy,
      alertas_fuga_count: alerta.total,
    };
  }

  async alertaFuga(clubId: number) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');

    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    hace30.setHours(0, 0, 0, 0);

    const socios = await this.prisma.socio.findMany({
      where: { club_id: clubId },
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        telefono: true,
        pagos: {
          where: { estado: 'pendiente' },
          select: { id: true },
        },
        asistencias: {
          where: { fecha: { gte: hace30 } },
          select: { estado: true },
        },
      },
    });

    const items: Array<{
      id: number;
      dni: string;
      nombre: string;
      apellido: string;
      cuotas_pendientes: number;
      asistencia_pct: number | null;
      motivo: string;
      whatsapp_url: string | null;
    }> = [];

    for (const s of socios) {
      const cuotas_pendientes = s.pagos.length;
      const totalAsist = s.asistencias.length;
      let asistencia_pct: number | null = null;
      if (totalAsist > 0) {
        const presentes = s.asistencias.filter(
          (a) => a.estado === 'presente',
        ).length;
        asistencia_pct =
          Math.round((presentes / totalAsist) * 10000) / 100;
      }

      const motivos: string[] = [];
      if (cuotas_pendientes >= club.regla_moroso_cuotas) {
        motivos.push('moroso');
      }
      if (asistencia_pct !== null && asistencia_pct < 50) {
        motivos.push('baja_asistencia');
      }
      if (motivos.length === 0) continue;

      const mensaje = `Hola ${s.nombre}, te escribimos desde el club. ¿Todo bien? Queremos saber si necesitás algo.`;
      items.push({
        id: s.id,
        dni: s.dni,
        nombre: s.nombre,
        apellido: s.apellido,
        cuotas_pendientes,
        asistencia_pct,
        motivo: motivos.join('+'),
        whatsapp_url: whatsappUrl(s.telefono, mensaje),
      });
    }

    return { socios: items, total: items.length };
  }

  async cumpleanos(clubId: number, mes?: string) {
    const m = mes || mesActual();
    const monthNum = Number(m.split('-')[1]);
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      return { mes: m, socios: [] };
    }

    const socios = await this.prisma.socio.findMany({
      where: {
        club_id: clubId,
        fecha_nacimiento: { not: null },
      },
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        fecha_nacimiento: true,
        telefono: true,
        email: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    const filtrados = socios.filter((s) => {
      if (!s.fecha_nacimiento) return false;
      return s.fecha_nacimiento.getMonth() + 1 === monthNum;
    });

    return { mes: m, socios: filtrados };
  }

  async generarNoticiasCumple(clubId: number) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');
    if (!club.cumples_auto) {
      return { created: 0, skipped: true, reason: 'cumples_auto desactivado' };
    }

    const now = new Date();
    const socios = await this.prisma.socio.findMany({
      where: {
        club_id: clubId,
        fecha_nacimiento: { not: null },
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        fecha_nacimiento: true,
      },
    });

    const cumpleHoy = socios.filter((s) => {
      if (!s.fecha_nacimiento) return false;
      return (
        s.fecha_nacimiento.getDate() === now.getDate() &&
        s.fecha_nacimiento.getMonth() === now.getMonth()
      );
    });

    let created = 0;
    const inicioDia = startOfDay(now);

    for (const s of cumpleHoy) {
      const nombreCompleto = `${s.nombre} ${s.apellido}`;
      const existing = await this.prisma.noticia.findFirst({
        where: {
          club_id: clubId,
          fecha: { gte: inicioDia },
          titulo: { contains: s.nombre, mode: 'insensitive' },
        },
      });
      if (existing) continue;

      await this.prisma.noticia.create({
        data: {
          club_id: clubId,
          titulo: `¡Feliz cumpleaños ${nombreCompleto}!`,
          cuerpo: `Hoy celebramos el cumpleaños de ${nombreCompleto}. ¡Que lo pases genial!`,
          es_evento: false,
          fecha: now,
          published: true,
        },
      });
      created++;
    }

    return { created };
  }
}
