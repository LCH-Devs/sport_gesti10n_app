import { Module } from '@nestjs/common';
import { FamiliasController } from './familias.controller';
import { FamiliasService } from './familias.service';
import { SociosModule } from '../socios/socios.module';
import { PlanSaaSModule } from '../plan-saas/plan-saas.module';
import { PagosModule } from '../pagos/pagos.module';

@Module({
  imports: [SociosModule, PlanSaaSModule, PagosModule],
  controllers: [FamiliasController],
  providers: [FamiliasService],
})
export class FamiliasModule {}

