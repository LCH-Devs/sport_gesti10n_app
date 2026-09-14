import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ClubId } from '../common/club-id.decorator';
import { JwtUser } from '../common/jwt-user.decorator';
import { SocioRoleGuard } from '../common/socio-role.guard';
import { UseClubAuth } from '../common/use-club-auth';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreateReservaSelfDto } from './dto/reserva.dto';

/** Portal socio: reservas propias únicamente (nunca a nombre de otra membresía). */
@Controller('socio/reservas')
@UseClubAuth(SocioRoleGuard)
export class ReservasSocioController {
  constructor(private readonly reservas: ReservasService) {}

  @Get()
  listPropias(@ClubId() clubId: number, @JwtUser() user: JwtPayload) {
    return this.reservas.listPropias(clubId, user.sub);
  }

  @Post()
  crearPropia(
    @ClubId() clubId: number,
    @JwtUser() user: JwtPayload,
    @Body() dto: CreateReservaSelfDto,
  ) {
    return this.reservas.crearPropia(clubId, user.sub, dto);
  }

  @Patch(':id/cancelar')
  cancelarPropia(
    @ClubId() clubId: number,
    @JwtUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservas.cancelarPropia(clubId, user.sub, id);
  }
}
