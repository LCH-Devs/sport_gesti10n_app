import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Health real: si la DB no responde, un orquestador/balanceador tiene que
   * poder verlo (503), no recibir un {ok:true} fijo que no prueba nada.
   */
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        service: 'clubapp-api',
        db: 'down',
      });
    }
    return { ok: true, service: 'clubapp-api', db: 'up' };
  }
}
