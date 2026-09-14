import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventosService } from './eventos.service';

/** Feed cross-tenant de eventos públicos, visible para cualquier identidad logueada. */
@Controller('eventos-publicos')
@UseGuards(JwtAuthGuard)
export class EventosPublicController {
  constructor(private readonly eventos: EventosService) {}

  @Get()
  listPublicos() {
    return this.eventos.listPublicos();
  }
}
