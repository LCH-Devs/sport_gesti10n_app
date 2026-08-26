import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { flattenPerson, NOT_DELETED, personInclude } from '../common/club-users';
import { CerrarMesDto, CreateCobroProfeDto } from './dto/liquidacion.dto';

@Injectable()
export class LiquidacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crearCobro(clubId: number, dto: CreateCobroProfeDto) {
    const actividad = await this.prisma.actividad.findFirst({
      where: { id: dto.actividad_id, club_id: clubId, ...NOT_DELETED },
    });
    if (!actividad) throw new BadRequestException('Actividad no encontrada');
    if (!actividad.profe_id) {
      throw new BadRequestException('La actividad no tiene profesor asignado');
    }

    const socio = await this.prisma.membresia.findFirst({
      where: { id: dto.socio_id, club_id: clubId, ...NOT_DELETED },
    });
    if (!socio) throw new BadRequestException('Socio no encontrado');

    const comision_club = this.calcularComision(
      dto.monto_alumno,
      actividad.comision_tipo,
      actividad.comision_valor,
    );

    const row = await this.prisma.cobroProfe.upsert({
      where: {
        actividad_id_socio_id_mes: {
          actividad_id: dto.actividad_id,
          socio_id: dto.socio_id,
          mes: dto.mes,
        },
      },
      create: {
        club_id: clubId,
        actividad_id: dto.actividad_id,
        socio_id: dto.socio_id,
        profe_id: actividad.profe_id,
        mes: dto.mes,
        monto_alumno: dto.monto_alumno,
        comision_club,
        medio: dto.medio || 'efectivo',
        nota: dto.nota,
        cobrado: true,
      },
      update: {
        monto_alumno: dto.monto_alumno,
        comision_club,
        medio: dto.medio || 'efectivo',
        nota: dto.nota,
        profe_id: actividad.profe_id,
        cobrado: true,
      },
      include: {
        socio: { include: personInclude },
        profe: { include: personInclude },
        actividad: { select: { id: true, nombre: true } },
      },
    });
    return {
      ...row,
      socio: flattenPerson(row.socio),
      profe: flattenPerson(row.profe),
    };
  }

  async listCobros(clubId: number, mes?: string) {
    const rows = await this.prisma.cobroProfe.findMany({
      where: {
        club_id: clubId,
        ...(mes && { mes }),
      },
      include: {
        socio: { include: personInclude },
        profe: { include: personInclude },
        actividad: { select: { id: true, nombre: true } },
      },
      orderBy: [{ mes: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => ({
      ...row,
      socio: flattenPerson(row.socio),
      profe: flattenPerson(row.profe),
    }));
  }

  async cerrarMes(clubId: number, dto: CerrarMesDto) {
    const profe = await this.prisma.membresia.findFirst({
      where: { id: dto.profe_id, club_id: clubId, ...NOT_DELETED },
    });
    if (!profe) throw new BadRequestException('Profesor no encontrado');

    const cobros = await this.prisma.cobroProfe.findMany({
      where: {
        club_id: clubId,
        profe_id: dto.profe_id,
        mes: dto.mes,
        cobrado: true,
      },
    });

    const total_club = cobros.reduce((acc: number, c: any) => acc + c.comision_club, 0);

    const row = await this.prisma.liquidacionProfe.upsert({
      where: {
        profe_id_mes: { profe_id: dto.profe_id, mes: dto.mes },
      },
      create: {
        club_id: clubId,
        profe_id: dto.profe_id,
        mes: dto.mes,
        total_club,
        estado: 'pendiente',
      },
      update: {
        total_club,
        estado: 'pendiente',
        fecha_pago: null,
      },
      include: {
        profe: { include: personInclude },
      },
    });
    return { ...row, profe: flattenPerson(row.profe) };
  }

  async listLiquidaciones(clubId: number, mes?: string) {
    const rows = await this.prisma.liquidacionProfe.findMany({
      where: {
        club_id: clubId,
        ...(mes && { mes }),
      },
      include: {
        profe: { include: personInclude },
      },
      orderBy: [{ mes: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => ({ ...row, profe: flattenPerson(row.profe) }));
  }

  async marcarPagada(clubId: number, id: number) {
    const liq = await this.prisma.liquidacionProfe.findFirst({
      where: { id, club_id: clubId },
    });
    if (!liq) throw new NotFoundException('Liquidación no encontrada');

    const updated = await this.prisma.liquidacionProfe.update({
      where: { id },
      data: {
        estado: 'pagada',
        fecha_pago: new Date(),
      },
      include: {
        profe: { include: personInclude },
      },
    });
    return { ...updated, profe: flattenPerson(updated.profe) };
  }

  private calcularComision(
    monto: number,
    tipo: string | null,
    valor: number | null,
  ): number {
    if (!tipo || valor == null) return 0;
    if (tipo === 'porcentaje') {
      return Math.round(monto * (valor / 100) * 100) / 100;
    }
    if (tipo === 'fijo') return valor;
    return 0;
  }
}

