import { Module } from '@nestjs/common';
import { SociosService } from './socios.service';
import { SociosController } from './socios.controller';
import { SocioPortalController } from './socio-portal.controller';
import { PlanSaaSModule } from '../plan-saas/plan-saas.module';
import { PagosModule } from '../pagos/pagos.module';
import { ProfePortalController } from './profe-portal.controller';

@Module({
  imports: [PlanSaaSModule, PagosModule],
  controllers: [SociosController, SocioPortalController, ProfePortalController],
  providers: [SociosService],
  exports: [SociosService],
})
export class SociosModule {}
