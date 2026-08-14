import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CerrarMesDto, CreateCobroProfeDto } from './dto/liquidacion.dto';

@Injectable()
export class LiquidacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crearCobro(clubId: number, dto: CreateCobroProfeDto) {
    const actividad = await this.prisma.actividad.findFirst({
      where: { id: dto.actividad_id, club_id: clubId },
    });
    if (!actividad) throw new BadRequestException('Actividad no encontrada');
    if (!actividad.profe_id) {
      throw new BadRequestException('La actividad no tiene profesor asignado');
    }

    const socio = await this.prisma.socio.findFirst({
      where: { id: dto.socio_id, club_id: clubId },
    });
    if (!socio) throw new BadRequestException('Socio no encontrado');

    const comision_club = this.calcularComision(
      dto.monto_alumno,
      actividad.comision_tipo,
      actividad.comision_valor,
    );

    return this.prisma.cobroProfe.upsert({
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
        socio: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
        profe: {
          select: { id: true, nombre: true, apellido: true },
        },
        actividad: { select: { id: true, nombre: true } },
      },
    });
  }

  listCobros(clubId: number, mes?: string) {
    return this.prisma.cobroProfe.findMany({
      where: {
        club_id: clubId,
        ...(mes && { mes }),
      },
      include: {
        socio: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
        profe: {
          select: { id: true, nombre: true, apellido: true },
        },
        actividad: { select: { id: true, nombre: true } },
      },
      orderBy: [{ mes: 'desc' }, { id: 'desc' }],
    });
  }

  async cerrarMes(clubId: number, dto: CerrarMesDto) {
    const profe = await this.prisma.socio.findFirst({
      where: { id: dto.profe_id, club_id: clubId },
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

    const total_club = cobros.reduce((acc, c) => acc + c.comision_club, 0);

    return this.prisma.liquidacionProfe.upsert({
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
        profe: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
      },
    });
  }

  listLiquidaciones(clubId: number, mes?: string) {
    return this.prisma.liquidacionProfe.findMany({
      where: {
        club_id: clubId,
        ...(mes && { mes }),
      },
      include: {
        profe: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
      },
      orderBy: [{ mes: 'desc' }, { id: 'desc' }],
    });
  }

  async marcarPagada(clubId: number, id: number) {
    const liq = await this.prisma.liquidacionProfe.findFirst({
      where: { id, club_id: clubId },
    });
    if (!liq) throw new NotFoundException('Liquidación no encontrada');

    return this.prisma.liquidacionProfe.update({
      where: { id },
      data: {
        estado: 'pagada',
        fecha_pago: new Date(),
      },
      include: {
        profe: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
      },
    });
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
