import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import { JwtUser } from '../common/jwt-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('notificaciones')
@UseClubAuth()
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  list(@ClubId() clubId: number, @JwtUser() user: JwtPayload) {
    return this.notificaciones.list(clubId, user.sub);
  }

  @Patch(':id/leido')
  marcarLeida(
    @ClubId() clubId: number,
    @JwtUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificaciones.marcarLeida(clubId, user.sub, id);
  }

  @Patch('marcar-todas-leidas')
  marcarTodasLeidas(@ClubId() clubId: number, @JwtUser() user: JwtPayload) {
    return this.notificaciones.marcarTodasLeidas(clubId, user.sub);
  }
}
