import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PlanSaaSJob } from './plan-saas.job';
import { PlanSaaSPublicController } from './plan-saas-public.controller';
import { PlanSaaSPlatformController } from './plan-saas.controller';
import { PlanSaaSService } from './plan-saas.service';

@Module({
  imports: [MailModule],
  controllers: [PlanSaaSPlatformController, PlanSaaSPublicController],
  providers: [PlanSaaSService, PlanSaaSJob],
  exports: [PlanSaaSService],
})
export class PlanSaaSModule {}
