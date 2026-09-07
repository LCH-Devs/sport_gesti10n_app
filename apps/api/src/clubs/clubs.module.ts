import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { MediaModule } from '../media/media.module';
import { PlanSaaSModule } from '../plan-saas/plan-saas.module';

@Module({
  imports: [MediaModule, PlanSaaSModule],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}

