import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EspaciosService } from './espacios.service';
import { ClubId } from '../common/club-id.decorator';
import { SocioRoleGuard } from '../common/socio-role.guard';
import { UseClubAuth } from '../common/use-club-auth';

/** Portal socio: solo lectura, para elegir dónde y cuándo reservar. */
@Controller('socio/espacios')
@UseClubAuth(SocioRoleGuard)
export class EspaciosSocioController {
  constructor(private readonly espacios: EspaciosService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.espacios.listActivos(clubId);
  }

  @Get(':id/disponibilidad')
  disponibilidad(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('fecha') fecha: string,
  ) {
    return this.espacios.disponibilidad(clubId, id, fecha);
  }
}
