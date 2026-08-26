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
import { ActividadesService } from './actividades.service';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubStaffGuard } from '../common/club-staff.guard';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import {
  CreateActividadDto,
  SetSociosActividadDto,
  UpdateActividadDto,
} from './dto/actividad.dto';

@Controller('actividades')
@UseClubAuth(ClubStaffGuard)
export class ActividadesController {
  constructor(private readonly actividades: ActividadesService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.actividades.list(clubId);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateActividadDto) {
    return this.actividades.create(clubId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadDto,
  ) {
    return this.actividades.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.actividades.remove(clubId, id);
  }

  @Get(':id/socios')
  getSocios(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.actividades.getSocios(clubId, id);
  }

  @Post(':id/socios')
  @UseGuards(AdminRoleGuard)
  setSocios(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetSociosActividadDto,
  ) {
    return this.actividades.setSocios(clubId, id, dto);
  }
}

