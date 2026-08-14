import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePartidoDto,
  CreateTorneoDto,
  UpdateResultadoDto,
  UpdateTorneoDto,
} from './dto/torneo.dto';

@Injectable()
export class TorneosService {
  constructor(private readonly prisma: PrismaService) {}

  list(clubId: number) {
    return this.prisma.torneo.findMany({
      where: { club_id: clubId },
      include: { _count: { select: { partidos: true } } },
      orderBy: { id: 'desc' },
    });
  }

  create(clubId: number, dto: CreateTorneoDto) {
    return this.prisma.torneo.create({
      data: {
        club_id: clubId,
        nombre: dto.nombre.trim(),
        deporte: dto.deporte.trim(),
        estado: dto.estado || 'activo',
      },
    });
  }

  async update(clubId: number, id: number, dto: UpdateTorneoDto) {
    await this.ensureTorneo(clubId, id);
    return this.prisma.torneo.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.deporte !== undefined && { deporte: dto.deporte }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
      },
    });
  }

  async remove(clubId: number, id: number) {
    await this.ensureTorneo(clubId, id);
    await this.prisma.torneo.delete({ where: { id } });
    return { ok: true };
  }

  async crearPartido(clubId: number, torneoId: number, dto: CreatePartidoDto) {
    await this.ensureTorneo(clubId, torneoId);
    return this.prisma.partido.create({
      data: {
        club_id: clubId,
        torneo_id: torneoId,
        rival_a: dto.rival_a.trim(),
        rival_b: dto.rival_b.trim(),
        fecha: dto.fecha ? new Date(dto.fecha) : null,
      },
    });
  }

  async listPartidos(clubId: number, torneoId: number) {
    await this.ensureTorneo(clubId, torneoId);
    return this.prisma.partido.findMany({
      where: { torneo_id: torneoId, club_id: clubId },
      orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
    });
  }

  async updateResultado(
    clubId: number,
    partidoId: number,
    dto: UpdateResultadoDto,
  ) {
    const partido = await this.prisma.partido.findFirst({
      where: { id: partidoId, club_id: clubId },
    });
    if (!partido) throw new NotFoundException('Partido no encontrado');

    return this.prisma.partido.update({
      where: { id: partidoId },
      data: {
        goles_a: dto.goles_a,
        goles_b: dto.goles_b,
        jugado: dto.jugado ?? true,
      },
    });
  }

  async tabla(clubId: number, torneoId: number) {
    await this.ensureTorneo(clubId, torneoId);
    const partidos = await this.prisma.partido.findMany({
      where: { torneo_id: torneoId, club_id: clubId, jugado: true },
    });

    type Stats = {
      equipo: string;
      puntos: number;
      jugados: number;
      ganados: number;
      empatados: number;
      perdidos: number;
      goles_favor: number;
      goles_contra: number;
    };
    const map = new Map<string, Stats>();

    const ensure = (nombre: string) => {
      if (!map.has(nombre)) {
        map.set(nombre, {
          equipo: nombre,
          puntos: 0,
          jugados: 0,
          ganados: 0,
          empatados: 0,
          perdidos: 0,
          goles_favor: 0,
          goles_contra: 0,
        });
      }
      return map.get(nombre)!;
    };

    for (const p of partidos) {
      if (p.goles_a == null || p.goles_b == null) continue;
      const a = ensure(p.rival_a);
      const b = ensure(p.rival_b);
      a.jugados++;
      b.jugados++;
      a.goles_favor += p.goles_a;
      a.goles_contra += p.goles_b;
      b.goles_favor += p.goles_b;
      b.goles_contra += p.goles_a;

      if (p.goles_a > p.goles_b) {
        a.puntos += 3;
        a.ganados++;
        b.perdidos++;
      } else if (p.goles_a < p.goles_b) {
        b.puntos += 3;
        b.ganados++;
        a.perdidos++;
      } else {
        a.puntos += 1;
        b.puntos += 1;
        a.empatados++;
        b.empatados++;
      }
    }

    const ranking = [...map.values()].sort((x, y) => {
      if (y.puntos !== x.puntos) return y.puntos - x.puntos;
      const dgX = x.goles_favor - x.goles_contra;
      const dgY = y.goles_favor - y.goles_contra;
      if (dgY !== dgX) return dgY - dgX;
      return y.goles_favor - x.goles_favor;
    });

    return { torneo_id: torneoId, tabla: ranking };
  }

  private async ensureTorneo(clubId: number, id: number) {
    const t = await this.prisma.torneo.findFirst({
      where: { id, club_id: clubId },
    });
    if (!t) throw new NotFoundException('Torneo no encontrado');
    return t;
  }
}
