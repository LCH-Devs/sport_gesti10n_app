import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosPublicController } from './eventos-public.controller';
import { EventosService } from './eventos.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [EventosController, EventosPublicController],
  providers: [EventosService],
})
export class EventosModule {}
