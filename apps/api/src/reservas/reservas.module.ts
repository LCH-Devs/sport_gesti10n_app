import { Module } from '@nestjs/common';
import { ReservasController } from './reservas.controller';
import { ReservasSocioController } from './reservas-socio.controller';
import { ReservasService } from './reservas.service';

@Module({
  controllers: [ReservasController, ReservasSocioController],
  providers: [ReservasService],
})
export class ReservasModule {}

