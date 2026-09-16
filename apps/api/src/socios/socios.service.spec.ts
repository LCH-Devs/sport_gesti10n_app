import { BadRequestException, NotFoundException } from '@nestjs/common';
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
        findFirst: jest.fn((args: { where: Record<string, unknown> }) => {
          // Distinguir el lookup por DNI (import) del chequeo de membresía
          // activa en otro club (hasActiveMembershipElsewhere): esta
          // persona no tiene otra membresía activa, así que ese segundo
          // findFirst debe resolver null.
          if (args.where.usuario) {
            return Promise.resolve({
              id: 8,
              usuario_id: 3,
              usuario: { email: 'carlos@mail.com' },
            });
          }
          return Promise.resolve(null);
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

describe('SociosService update — no pisa identidad compartida con otro club', () => {
  function makePrisma(crossClubMembresia: unknown) {
    return {
      membresia: {
        findFirst: jest.fn((args: { where: Record<string, unknown> }) => {
          // ensureInClub busca por id de membresía; el guard de identidad
          // compartida busca por usuario_id + club distinto.
          if ('id' in args.where) {
            return Promise.resolve({
              id: 99,
              usuario_id: 3,
              club_id: 1,
              rol: 'socio',
              eliminado: false,
            });
          }
          return Promise.resolve(crossClubMembresia);
        }),
      },
      usuario: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          nombre: 'Carlos',
          apellido: 'Gomez',
          email: 'carlos@mail.com',
          telefono: '111',
          fecha_nacimiento: new Date('1990-08-14'),
        }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          usuario: { update: jest.fn().mockResolvedValue({}) },
          membresia: {
            update: jest.fn().mockResolvedValue({ id: 99, usuario: {} }),
          },
        }),
      ),
    };
  }

  it('rechaza cambiar nombre si la persona es socio/admin activo en otro club', async () => {
    const prisma = makePrisma({ id: 55 });
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await expect(
      service.update(1, 99, { nombre: 'Otro nombre' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('permite cambiar solo el estado aunque sea activo en otro club', async () => {
    const prisma = makePrisma({ id: 55 });
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await expect(
      service.update(1, 99, { estado: 'moroso' }),
    ).resolves.toBeDefined();
  });

  it('permite cambiar nombre si no hay membresía activa en otro club', async () => {
    const prisma = makePrisma(null);
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await expect(
      service.update(1, 99, { nombre: 'Nuevo nombre' }),
    ).resolves.toBeDefined();
  });

  it('no rechaza si el nombre enviado es igual al actual (no hay cambio real)', async () => {
    const prisma = makePrisma({ id: 55 });
    const service = new SociosService(
      prisma as unknown as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await expect(
      service.update(1, 99, { nombre: 'Carlos' }),
    ).resolves.toBeDefined();
  });
});

describe('SociosService createWithClient — password inicial predecible', () => {
  function makeDb(overrides: { membresiaCreate?: jest.Mock } = {}) {
    const membresiaCreate =
      overrides.membresiaCreate ??
      jest.fn().mockImplementation(({ data }) => ({
        id: 50,
        rol: data.rol,
        es_socio: data.es_socio,
        estado: data.estado,
        must_change_password: data.must_change_password,
        categoria: null,
        usuario: {
          email: 'nueva@mail.com',
          nombre: 'Nueva',
          apellido: 'Persona',
          dni: '30111222',
          telefono: '',
          fecha_nacimiento: new Date('1990-01-01'),
        },
      }));
    return {
      db: {
        membresia: {
          findFirst: jest.fn().mockResolvedValue(null), // assertDniFree: DNI libre
          create: membresiaCreate,
        },
        usuario: {
          findUnique: jest.fn().mockResolvedValue(null), // no existingUser
          create: jest.fn().mockResolvedValue({
            id: 7,
            email: 'nueva@mail.com',
            password_hash: 'hash',
          }),
        },
        categoriaCuota: {
          findFirst: jest.fn().mockResolvedValue({ id: 1 }),
        },
      } as any,
      membresiaCreate,
    };
  }

  const baseDto = {
    dni: '30111222',
    nombre: 'Nueva',
    apellido: 'Persona',
    email: 'nueva@mail.com',
    fecha_nacimiento: '1990-01-01',
    rol: 'socio',
    categoria_id: 1,
  };

  it('fuerza cambio de clave si se crea sin password propia (queda socio+DNI)', async () => {
    const { db, membresiaCreate } = makeDb();
    const service = new SociosService(
      {} as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await service.createWithClient(db, 1, baseDto as any, { skipPlanCheck: true });

    expect(membresiaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ must_change_password: true }),
      }),
    );
  });

  it('no fuerza cambio de clave si se especifica una password propia', async () => {
    const { db, membresiaCreate } = makeDb();
    const service = new SociosService(
      {} as PrismaService,
      stubPlanes(),
      stubPagos(),
    );

    await service.createWithClient(
      db,
      1,
      { ...baseDto, password: 'UnaClavePropia123!' } as any,
      { skipPlanCheck: true },
    );

    expect(membresiaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ must_change_password: false }),
      }),
    );
  });

  it('crea al profesor contratado con membresía pero sin alta de cobros', async () => {
    const { db, membresiaCreate } = makeDb();
    const pagos = stubPagos();
    const service = new SociosService(
      {} as PrismaService,
      stubPlanes(),
      pagos,
    );

    const result = await service.createWithClient(
      db,
      1,
      { ...baseDto, rol: 'profe', es_socio: false, categoria_id: undefined } as any,
      { skipPlanCheck: true },
    );

    expect(result.es_socio).toBe(false);
    expect(membresiaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rol: 'profe',
          es_socio: false,
          categoria_id: null,
        }),
      }),
    );
    expect(pagos.persistirAlta).not.toHaveBeenCalled();
  });
});
