import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PlatformSolicitudesController } from './platform-solicitudes.controller';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      errorMessage: 'Demasiadas solicitudes. Probá de nuevo en un minuto.',
      throttlers: [{ ttl: 60_000, limit: 5 }],
    }),
  ],
  controllers: [SolicitudesController, PlatformSolicitudesController],
  providers: [SolicitudesService],
})
export class SolicitudesModule {}
