import { NotFoundException } from '@nestjs/common';
import { SociosService } from './socios.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SociosService aislamiento por club', () => {
  it('no actualiza un socio que no pertenece al club del JWT', async () => {
    const prisma = {
      membresia: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new SociosService(prisma as unknown as PrismaService);

    await expect(
      service.update(1, 99, { nombre: 'Otro club' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.membresia.findFirst).toHaveBeenCalledWith({
      where: {
        id: 99,
        club_id: 1,
        rol: { in: ['socio', 'profe'] },
        eliminado: false,
      },
    });
  });

  it('lista solo socios del club pedido', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { membresia: { findMany } };
    const service = new SociosService(prisma as unknown as PrismaService);

    await service.list(7);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { club_id: 7, rol: { in: ['socio', 'profe'] }, eliminado: false },
      }),
    );
  });
});
