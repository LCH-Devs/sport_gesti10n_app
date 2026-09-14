import { BadRequestException } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminsService update — no pisa identidad compartida con otro club', () => {
  function makePrisma(crossClubMembresia: unknown) {
    return {
      membresia: {
        findFirst: jest.fn((args: { where: Record<string, unknown> }) => {
          if ('id' in args.where) {
            return Promise.resolve({
              id: 42,
              usuario_id: 3,
              club_id: 1,
              rol: 'admin',
              eliminado: false,
            });
          }
          return Promise.resolve(crossClubMembresia);
        }),
        update: jest
          .fn()
          .mockResolvedValue({ id: 42, rol: 'admin', usuario: {} }),
      },
      usuario: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          nombre: 'Ana',
          email: 'ana@mail.com',
          password_hash: 'hash',
        }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          usuario: { update: jest.fn().mockResolvedValue({}) },
          membresia: {
            update: jest
              .fn()
              .mockResolvedValue({ id: 42, rol: 'admin', usuario: {} }),
          },
        }),
      ),
    };
  }

  it('rechaza cambiar nombre si es activo en otro club', async () => {
    const prisma = makePrisma({ id: 77 });
    const service = new AdminsService(prisma as unknown as PrismaService);

    await expect(
      service.update(1, 42, { nombre: 'Otro nombre' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza resetear la contraseña si es activo en otro club', async () => {
    const prisma = makePrisma({ id: 77 });
    const service = new AdminsService(prisma as unknown as PrismaService);

    await expect(
      service.update(1, 42, { password: 'NuevaClave123!' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('permite cambiar solo el rol aunque sea activo en otro club', async () => {
    const prisma = makePrisma({ id: 77 });
    const service = new AdminsService(prisma as unknown as PrismaService);

    await expect(
      service.update(1, 42, { rol: 'entrada' }),
    ).resolves.toBeDefined();
  });

  it('permite cambiar nombre si no hay membresía activa en otro club', async () => {
    const prisma = makePrisma(null);
    const service = new AdminsService(prisma as unknown as PrismaService);

    await expect(
      service.update(1, 42, { nombre: 'Nuevo nombre' }),
    ).resolves.toBeDefined();
  });
});
