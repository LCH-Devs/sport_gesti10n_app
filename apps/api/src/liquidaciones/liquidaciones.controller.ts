import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { CerrarMesDto, CreateCobroProfeDto } from './dto/liquidacion.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class LiquidacionesController {
  constructor(private readonly liquidaciones: LiquidacionesService) {}

  @Post('cobros-profe')
  @UseGuards(AdminRoleGuard)
  crearCobro(@ClubId() clubId: number, @Body() dto: CreateCobroProfeDto) {
    return this.liquidaciones.crearCobro(clubId, dto);
  }

  @Get('cobros-profe')
  listCobros(@ClubId() clubId: number, @Query('mes') mes?: string) {
    return this.liquidaciones.listCobros(clubId, mes);
  }

  @Post('liquidaciones-profe/cerrar-mes')
  @UseGuards(AdminRoleGuard)
  cerrarMes(@ClubId() clubId: number, @Body() dto: CerrarMesDto) {
    return this.liquidaciones.cerrarMes(clubId, dto);
  }

  @Get('liquidaciones-profe')
  listLiquidaciones(@ClubId() clubId: number, @Query('mes') mes?: string) {
    return this.liquidaciones.listLiquidaciones(clubId, mes);
  }

  @Patch('liquidaciones-profe/:id/marcar-pagada')
  @UseGuards(AdminRoleGuard)
  marcarPagada(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.liquidaciones.marcarPagada(clubId, id);
  }
}
