import { Module } from '@nestjs/common';
import { EspaciosController } from './espacios.controller';
import { EspaciosSocioController } from './espacios-socio.controller';
import { EspaciosService } from './espacios.service';

@Module({
  controllers: [EspaciosController, EspaciosSocioController],
  providers: [EspaciosService],
  exports: [EspaciosService],
})
export class EspaciosModule {}

