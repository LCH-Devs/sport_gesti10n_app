import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { flattenPerson, NOT_DELETED, personInclude } from '../common/club-users';
import { CreateReservaDto } from './dto/reserva.dto';

const OCUPADO_MSG = 'Horario ocupado: solapamiento con otra reserva confirmada';
const MAX_SERIALIZATION_RETRIES = 3;

function isSerializationFailure(err: unknown): boolean {
  // P2034: "Transaction failed due to a write conflict or a deadlock.
  // Please retry your transaction" — el mapeo de Prisma para el
  // serialization_failure (40001) de Postgres bajo aislamiento Serializable.
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034'
  );
}

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    clubId: number,
    filtros: { desde?: string; hasta?: string; espacio_id?: number },
  ) {
    const where: {
      club_id: number;
      espacio_id?: number;
      inicio?: { gte?: Date; lte?: Date };
    } = { club_id: clubId };

    if (filtros.espacio_id) where.espacio_id = filtros.espacio_id;
    if (filtros.desde || filtros.hasta) {
      where.inicio = {};
      if (filtros.desde) where.inicio.gte = new Date(filtros.desde);
      if (filtros.hasta) where.inicio.lte = new Date(filtros.hasta);
    }

    const rows = await this.prisma.reserva.findMany({
      where,
      include: {
        socio: { include: personInclude },
        espacio: { select: { id: true, nombre: true, tipo: true } },
      },
      orderBy: { inicio: 'asc' },
    });
    return rows.map((r) => ({ ...r, socio: flattenPerson(r.socio) }));
  }

  async create(clubId: number, dto: CreateReservaDto) {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    if (!(inicio < fin)) {
      throw new BadRequestException('inicio debe ser anterior a fin');
    }

    const espacio = await this.prisma.espacio.findFirst({
      where: { id: dto.espacio_id, club_id: clubId, activo: true, ...NOT_DELETED },
    });
    if (!espacio) {
      throw new BadRequestException('Espacio no encontrado o inactivo');
    }

    const socio = await this.prisma.membresia.findFirst({
      where: { id: dto.socio_id, club_id: clubId, ...NOT_DELETED },
    });
    if (!socio) throw new BadRequestException('Socio no encontrado');
    if (socio.estado === 'suspendido') {
      throw new BadRequestException('Socio suspendido');
    }

    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club no encontrado');

    if (club.bloquear_reservas) {
      const pendientes = await this.prisma.pago.count({
        where: {
          club_id: clubId,
          socio_id: socio.id,
          estado: 'pendiente',
        },
      });
      if (pendientes >= club.regla_moroso_cuotas) {
        throw new BadRequestException(
          'Socio con cuotas pendientes; reservas bloqueadas',
        );
      }
    }

    // El chequeo de solapamiento y de máximo de reservas activas debe ser
    // indivisible junto con el insert: dos requests simultáneas para el
    // mismo espacio/socio no pueden pasar ambas la validación y crear dos
    // filas. Serializable hace que Postgres aborte una de las dos
    // transacciones en conflicto (P2034), y reintentamos esa sola. El
    // EXCLUDE constraint "reserva_no_solape" es el backstop final a nivel
    // de DB por si algo más escribe fuera de este método.
    for (let attempt = 1; attempt <= MAX_SERIALIZATION_RETRIES; attempt++) {
      try {
        const created = await this.prisma.$transaction(
          async (tx) => {
            const ahora = new Date();
            const activas = await tx.reserva.count({
              where: {
                club_id: clubId,
                socio_id: socio.id,
                estado: 'confirmada',
                inicio: { gt: ahora },
              },
            });
            if (activas >= club.max_reservas_activas) {
              throw new BadRequestException(
                `Máximo de ${club.max_reservas_activas} reservas activas alcanzado`,
              );
            }

            const solape = await tx.reserva.findFirst({
              where: {
                club_id: clubId,
                espacio_id: espacio.id,
                estado: 'confirmada',
                inicio: { lt: fin },
                fin: { gt: inicio },
              },
            });
            if (solape) {
              throw new BadRequestException(OCUPADO_MSG);
            }

            return tx.reserva.create({
              data: {
                club_id: clubId,
                espacio_id: espacio.id,
                socio_id: socio.id,
                inicio,
                fin,
                nota: dto.nota,
                estado: 'confirmada',
              },
              include: {
                socio: { include: personInclude },
                espacio: { select: { id: true, nombre: true } },
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return { ...created, socio: flattenPerson(created.socio) };
      } catch (err) {
        if (isSerializationFailure(err) && attempt < MAX_SERIALIZATION_RETRIES) {
          continue;
        }
        // Los errores que nosotros mismos tiramos adentro de la transacción
        // (BadRequestException/NotFoundException) ya son mensajes claros:
        // se propagan tal cual. Cualquier otro fallo llegado hasta acá solo
        // puede venir de un conflicto real de escritura en este mismo path
        // (serialización agotada o el EXCLUDE constraint de respaldo
        // "reserva_no_solape", que Prisma no mapea a un código conocido) —
        // se traduce a un mensaje entendible en vez de un 500 crudo.
        if (err instanceof HttpException) {
          throw err;
        }
        throw new BadRequestException(OCUPADO_MSG);
      }
    }
    // Inalcanzable: el loop siempre retorna o tira en el último intento.
    throw new BadRequestException(OCUPADO_MSG);
  }

  async cancelar(clubId: number, id: number) {
    const reserva = await this.prisma.reserva.findFirst({
      where: { id, club_id: clubId },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    return this.prisma.reserva.update({
      where: { id },
      data: { estado: 'cancelada' },
    });
  }

  /** Portal socio: solo sus propias reservas, futuras primero. */
  async listPropias(clubId: number, socioId: number) {
    return this.prisma.reserva.findMany({
      where: { club_id: clubId, socio_id: socioId },
      include: { espacio: { select: { id: true, nombre: true, tipo: true } } },
      orderBy: { inicio: 'desc' },
      take: 50,
    });
  }

  /**
   * Portal socio: crea una reserva a su propio nombre. `socio_id` del DTO
   * de alta se ignora/pisa siempre con el id de la membresía autenticada —
   * un socio nunca puede reservar "a nombre de" otra membresía.
   */
  async crearPropia(
    clubId: number,
    socioId: number,
    dto: Omit<CreateReservaDto, 'socio_id'>,
  ) {
    return this.create(clubId, { ...dto, socio_id: socioId });
  }

  /** Portal socio: solo puede cancelar una reserva si es la titular. */
  async cancelarPropia(clubId: number, socioId: number, id: number) {
    const reserva = await this.prisma.reserva.findFirst({
      where: { id, club_id: clubId, socio_id: socioId },
    });
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return this.prisma.reserva.update({
      where: { id },
      data: { estado: 'cancelada' },
    });
  }
}

