import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TorneosService } from './torneos.service';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubStaffGuard } from '../common/club-staff.guard';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import {
  CreatePartidoDto,
  CreateTorneoDto,
  UpdateResultadoDto,
  UpdateTorneoDto,
} from './dto/torneo.dto';

@Controller()
@UseClubAuth(ClubStaffGuard)
export class TorneosController {
  constructor(private readonly torneos: TorneosService) {}

  @Get('torneos')
  list(@ClubId() clubId: number) {
    return this.torneos.list(clubId);
  }

  @Post('torneos')
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateTorneoDto) {
    return this.torneos.create(clubId, dto);
  }

  @Patch('torneos/:id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTorneoDto,
  ) {
    return this.torneos.update(clubId, id, dto);
  }

  @Delete('torneos/:id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.torneos.remove(clubId, id);
  }

  @Post('torneos/:id/partidos')
  @UseGuards(AdminRoleGuard)
  crearPartido(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePartidoDto,
  ) {
    return this.torneos.crearPartido(clubId, id, dto);
  }

  @Get('torneos/:id/partidos')
  listPartidos(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.torneos.listPartidos(clubId, id);
  }

  @Get('torneos/:id/tabla')
  tabla(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.torneos.tabla(clubId, id);
  }

  @Patch('partidos/:id/resultado')
  @UseGuards(AdminRoleGuard)
  updateResultado(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResultadoDto,
  ) {
    return this.torneos.updateResultado(clubId, id, dto);
  }
}

