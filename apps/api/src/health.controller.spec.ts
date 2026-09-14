import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';

describe('HealthController', () => {
  it('devuelve ok cuando la DB responde', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).resolves.toEqual({
      ok: true,
      service: 'clubapp-api',
      db: 'up',
    });
  });

  it('tira 503 cuando la DB no responde, en vez de decir ok:true a ciegas', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
