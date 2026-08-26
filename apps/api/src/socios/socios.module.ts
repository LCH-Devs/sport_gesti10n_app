import { Module } from '@nestjs/common';
import { SociosService } from './socios.service';
import { SociosController } from './socios.controller';
import { SocioPortalController } from './socio-portal.controller';

@Module({
  controllers: [SociosController, SocioPortalController],
  providers: [SociosService],
})
export class SociosModule {}

