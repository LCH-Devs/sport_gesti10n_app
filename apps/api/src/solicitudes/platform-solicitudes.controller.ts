import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformRoleGuard } from '../common/platform-role.guard';
import {
  ListSolicitudQuery,
  UpdateSolicitudDto,
} from './dto/solicitudes.dto';
import { SolicitudesService } from './solicitudes.service';

@Controller('platform/solicitudes')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlatformSolicitudesController {
  constructor(private readonly solicitudes: SolicitudesService) {}

  @Get()
  list(@Query() query: ListSolicitudQuery) {
    return this.solicitudes.list(query.estado);
  }

  @Get('pendientes/count')
  countPendientes() {
    return this.solicitudes.countPendientes();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.solicitudes.getOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSolicitudDto,
  ) {
    return this.solicitudes.update(id, dto);
  }
}
