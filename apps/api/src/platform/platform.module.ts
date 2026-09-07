import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { MailModule } from '../mail/mail.module';
import { PlanSaaSModule } from '../plan-saas/plan-saas.module';

@Module({
  imports: [MailModule, PlanSaaSModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}

