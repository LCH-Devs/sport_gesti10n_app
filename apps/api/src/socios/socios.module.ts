import { Module } from '@nestjs/common';
import { SociosService } from './socios.service';
import { SociosController } from './socios.controller';
import { SocioPortalController } from './socio-portal.controller';
import { PlanSaaSModule } from '../plan-saas/plan-saas.module';
import { PagosModule } from '../pagos/pagos.module';

@Module({
  imports: [PlanSaaSModule, PagosModule],
  controllers: [SociosController, SocioPortalController],
  providers: [SociosService],
  exports: [SociosService],
})
export class SociosModule {}

