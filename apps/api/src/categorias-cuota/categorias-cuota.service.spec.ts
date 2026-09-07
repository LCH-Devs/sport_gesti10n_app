import { BadRequestException } from '@nestjs/common';
import { CategoriasCuotaService } from './categorias-cuota.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriasCuotaService aislamiento', () => {
  it('lista solo categorías del club', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      club: { findUnique: jest.fn().mockResolvedValue({ cuota_monto: 5000 }) },
      categoriaCuota: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          slug: 'socio-pleno',
          es_default: true,
          eliminado: false,
          monto: 5000,
        }),
        findMany,
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = new CategoriasCuotaService(prisma as unknown as PrismaService);
    await service.list(7);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { club_id: 7, eliminado: false },
      }),
    );
  });

  it('no borra Socio pleno', async () => {
    const prisma = {
      categoriaCuota: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          club_id: 7,
          es_default: true,
          eliminado: false,
        }),
      },
    };
    const service = new CategoriasCuotaService(prisma as unknown as PrismaService);
    await expect(service.remove(7, 1)).rejects.toBeInstanceOf(BadRequestException);
  });
});
