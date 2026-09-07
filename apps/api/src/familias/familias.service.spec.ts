import { BadRequestException } from '@nestjs/common';
import { FamiliasService } from './familias.service';
import { PrismaService } from '../prisma/prisma.service';
import { SociosService } from '../socios/socios.service';
import { CreateSocioDto } from '../socios/dto/socio.dto';
import { PlanSaaSService } from '../plan-saas/plan-saas.service';
import { PagosService } from '../pagos/pagos.service';

const titularNuevo: CreateSocioDto = {
  dni: '30111222',
  nombre: 'Carlos',
  apellido: 'Gomez',
  email: 'carlos@mail.com',
  fecha_nacimiento: '1990-08-14',
  rol: 'socio',
};

describe('FamiliasService alta mixta', () => {
  function makeService(overrides?: {
    createWithClient?: jest.Mock;
    prisma?: Record<string, unknown>;
  }) {
    const createWithClient =
      overrides?.createWithClient ??
      jest.fn().mockResolvedValue({ id: 50 });
    const prisma = {
      grupoFamiliar: {
        create: jest.fn().mockResolvedValue({ id: 9, titular_id: 50 }),
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          nombre: 'Gomez',
          titular: {
            id: 50,
            rol: 'socio',
            usuario: {
              dni: '30111222',
              nombre: 'Carlos',
              apellido: 'Gomez',
              email: 'carlos@mail.com',
            },
          },
          socios: [],
        }),
        update: jest.fn(),
      },
      membresia: {
        findFirst: jest.fn().mockResolvedValue({ id: 7 }),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: undefined as unknown as jest.Mock,
      ...overrides?.prisma,
    };
    prisma.$transaction = jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(prisma),
    );
    const socios = { createWithClient } as unknown as SociosService;
    const planes = {
      assertCanAddMembers: jest.fn().mockResolvedValue(undefined),
    } as unknown as PlanSaaSService;
    const pagos = {
      generarLinksDeAlta: jest.fn().mockResolvedValue(undefined),
    } as unknown as PagosService;
    const service = new FamiliasService(
      prisma as unknown as PrismaService,
      socios,
      planes,
      pagos,
    );
    return { service, prisma, createWithClient };
  }

  it('rechaza titular_id y titular juntos', async () => {
    const { service } = makeService();
    await expect(
      service.create(1, {
        nombre: 'Gomez',
        titular_id: 7,
        titular: titularNuevo,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza si no hay titular', async () => {
    const { service } = makeService();
    await expect(
      service.create(1, { nombre: 'Gomez' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crea personas nuevas y el grupo en la misma transacción', async () => {
    const { service, prisma, createWithClient } = makeService({
      createWithClient: jest
        .fn()
        .mockResolvedValueOnce({ id: 50 })
        .mockResolvedValueOnce({ id: 51 }),
    });

    await service.create(1, {
      nombre: 'Gomez',
      titular: titularNuevo,
      socio_ids: [8],
      socios_nuevos: [
        {
          ...titularNuevo,
          dni: '30111223',
          email: 'hijo@mail.com',
          nombre: 'Luis',
        },
      ],
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(createWithClient).toHaveBeenCalledTimes(2);
    expect(prisma.grupoFamiliar.create).toHaveBeenCalledWith({
      data: { club_id: 1, nombre: 'Gomez', titular_id: 50 },
    });
    expect(prisma.membresia.updateMany).toHaveBeenCalledWith({
      where: { club_id: 1, id: { in: expect.arrayContaining([50, 51, 8]) } },
      data: { grupo_familiar_id: 9 },
    });
  });

  it('no deja el grupo si falla el alta de un miembro', async () => {
    const { service, prisma } = makeService({
      createWithClient: jest
        .fn()
        .mockResolvedValueOnce({ id: 50 })
        .mockRejectedValueOnce(new BadRequestException('DNI duplicado')),
    });

    await expect(
      service.create(1, {
        nombre: 'Gomez',
        titular: titularNuevo,
        socios_nuevos: [{ ...titularNuevo, dni: '30111222', email: 'otro@mail.com' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.grupoFamiliar.create).not.toHaveBeenCalled();
  });
});
