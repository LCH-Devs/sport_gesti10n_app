import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number, membresiaId: number) {
    return this.prisma.notificacion.findMany({
      where: { club_id: clubId, membresia_id: membresiaId },
      orderBy: { created_at: 'desc' },
      take: 30,
    });
  }

  async marcarLeida(clubId: number, membresiaId: number, id: number) {
    await this.prisma.notificacion.updateMany({
      where: { id, club_id: clubId, membresia_id: membresiaId },
      data: { leido: true },
    });
    return { ok: true };
  }

  async marcarTodasLeidas(clubId: number, membresiaId: number) {
    await this.prisma.notificacion.updateMany({
      where: { club_id: clubId, membresia_id: membresiaId, leido: false },
      data: { leido: true },
    });
    return { ok: true };
  }

  /** Notifica a todos los admins del club (usado al registrarse un socio nuevo). */
  async avisarAdmins(
    clubId: number,
    payload: { tipo: string; titulo: string; mensaje: string },
  ) {
    const admins = await this.prisma.membresia.findMany({
      where: { club_id: clubId, rol: 'admin', eliminado: false },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notificacion.createMany({
      data: admins.map((a) => ({
        club_id: clubId,
        membresia_id: a.id,
        tipo: payload.tipo,
        titulo: payload.titulo,
        mensaje: payload.mensaje,
      })),
    });
  }
}
