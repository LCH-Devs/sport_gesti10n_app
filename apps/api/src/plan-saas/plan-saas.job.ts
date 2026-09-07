import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PlanSaaSService } from './plan-saas.service';

const HORA_MS = 60 * 60 * 1000;

@Injectable()
export class PlanSaaSJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlanSaaSJob.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly planes: PlanSaaSService) {}

  onModuleInit() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), HORA_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    try {
      const result = await this.planes.aplicarVencidos();
      if (result.aplicados > 0) {
        this.logger.log(
          `Planes SaaS aplicados: ${result.aplicados} de ${result.revisados}`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Aplicar planes SaaS falló: ${msg}`);
    }
  }
}
