import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';

const HORA_MS = 60 * 60 * 1000;

@Injectable()
export class SolicitudesTrialJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SolicitudesTrialJob.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly solicitudes: SolicitudesService) {}

  onModuleInit() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), HORA_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    try {
      const result = await this.solicitudes.avisarTrialsPorVencer();
      if (result.enviados > 0) {
        this.logger.log(
          `Avisos trial 10d: ${result.enviados} de ${result.revisadas} en trial`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Avisos trial 10d fallaron: ${msg}`);
    }
  }
}
