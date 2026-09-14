import { NotFoundException } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReservasService — portal socio', () => {
  it('crearPropia siempre reserva a nombre del socio autenticado, ignore lo que venga en el dto', async () => {
    const service = new ReservasService({} as PrismaService);
    const createSpy = jest
      .spyOn(service, 'create')
      .mockResolvedValue({ id: 1 } as any);

    await service.crearPropia(7, 42, {
      espacio_id: 3,
      inicio: '2026-01-01T10:00:00.000Z',
      fin: '2026-01-01T11:00:00.000Z',
      // @ts-expect-error — CreateReservaSelfDto no tiene socio_id; probamos
      // que aunque alguien lo cuele en runtime, crearPropia lo pisa igual.
      socio_id: 999,
    });

    expect(createSpy).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ socio_id: 42 }),
    );
  });

  it('cancelarPropia no cancela una reserva de otro socio del mismo club', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = { reserva: { findFirst, update: jest.fn() } };
    const service = new ReservasService(prisma as unknown as PrismaService);

    await expect(service.cancelarPropia(7, 42, 100)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 100, club_id: 7, socio_id: 42 },
    });
    expect(prisma.reserva.update).not.toHaveBeenCalled();
  });

  it('cancelarPropia cancela cuando la reserva es del socio autenticado', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValue({ id: 100, club_id: 7, socio_id: 42 });
    const update = jest
      .fn()
      .mockResolvedValue({ id: 100, estado: 'cancelada' });
    const prisma = { reserva: { findFirst, update } };
    const service = new ReservasService(prisma as unknown as PrismaService);

    const result = await service.cancelarPropia(7, 42, 100);

    expect(update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: { estado: 'cancelada' },
    });
    expect(result.estado).toBe('cancelada');
  });

  it('listPropias solo pide reservas del socio autenticado', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { reserva: { findMany } };
    const service = new ReservasService(prisma as unknown as PrismaService);

    await service.listPropias(7, 42);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { club_id: 7, socio_id: 42 },
      }),
    );
  });
});
