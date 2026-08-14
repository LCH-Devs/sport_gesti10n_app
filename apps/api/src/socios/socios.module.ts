import { Module } from '@nestjs/common';
import { SociosService } from './socios.service';
import { SociosController } from './socios.controller';

@Module({
  controllers: [SociosController],
  providers: [SociosService],
})
export class SociosModule {}
