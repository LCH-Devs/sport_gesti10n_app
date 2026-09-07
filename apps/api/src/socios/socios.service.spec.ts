import { NotFoundException } from '@nestjs/common';
import { SociosService } from './socios.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlanSaaSService } from '../plan-saas/plan-saas.service';

function stubPlanes() {
  return {
    assertCanAddMembers: jest.fn().mockResolvedValue(undefined),
  } as unknown as PlanSaaSService;
}

function stubPagos() {
  return {
    persistirAlta: jest.fn().mockResolvedValue(undefined),
    generarLinksDeAlta: jest.fn().mockResolvedValue(undefined),
  } as unknown as import('../pagos/pagos.service').PagosService;
}

describe('SociosService aislamiento por club', () => {
  it('no actualiza un socio que no pertenece al club del JWT', async () => {
    const prisma = {
      membresia: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

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
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await service.list(7);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { club_id: 7, rol: { in: ['socio', 'profe'] }, eliminado: false },
      }),
    );
  });

  it('no devuelve un socio de otro club en getOne', async () => {
    const prisma = {
      membresia: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await expect(service.getOne(1, 99)).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.membresia.findFirst).toHaveBeenCalledWith({
      where: {
        id: 99,
        club_id: 1,
        rol: { in: ['socio', 'profe'] },
        eliminado: false,
      },
      include: expect.anything(),
    });
  });
});

describe('SociosService import DNI único por club', () => {
  const csv = [
    'dni,nombre,apellido,email,fecha_nacimiento,rol',
    '30111222,Carlos,Gomez,carlos@mail.com,14/08/1990,socio',
  ].join('\n');

  const pleno = {
    id: 1,
    nombre: 'Socio pleno',
    slug: 'socio-pleno',
    es_default: true,
    monto: 5000,
    club_id: 7,
    eliminado: false,
  };

  function categoriaPrisma() {
    return {
      club: { findUnique: jest.fn().mockResolvedValue({ cuota_monto: 5000 }) },
      categoriaCuota: {
        findFirst: jest.fn().mockResolvedValue(pleno),
        findMany: jest.fn().mockResolvedValue([pleno]),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
  }

  it('rechaza un DNI ya usado por otra persona del club', async () => {
    const prisma = {
      ...categoriaPrisma(),
      membresia: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue({
          id: 8,
          usuario_id: 3,
          usuario: { email: 'otro@mail.com' },
        }),
      },
    };
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    const result = await service.importCsv(7, csv);

    expect(result.created).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.errors).toEqual([
      'Fila 2: ya hay un usuario con ese DNI en el club',
    ]);
  });

  it('actualiza si el DNI y el email son de la misma persona', async () => {
    const usuarioUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      ...categoriaPrisma(),
      membresia: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue({
          id: 8,
          usuario_id: 3,
          usuario: { email: 'carlos@mail.com' },
        }),
      },
      usuario: { update: usuarioUpdate },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) =>
        fn({
          usuario: { update: usuarioUpdate },
          membresia: { update: jest.fn() },
        }),
      ),
    };
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    const result = await service.importCsv(7, csv);

    expect(result.created).toBe(0);
    expect(result.updated).toBe(1);
    expect(result.errors).toEqual([]);
  });
});
