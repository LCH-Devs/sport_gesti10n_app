import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformRoleGuard } from '../common/platform-role.guard';
import { PlanSaaSService } from './plan-saas.service';
import { ReplacePlanTramosDto } from './dto/plan-tramo.dto';

@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlanSaaSPlatformController {
  constructor(private readonly planes: PlanSaaSService) {}

  @Get('plan-tramos')
  listTramos() {
    return this.planes.listTramos();
  }

  @Get('plan-tramos/preview')
  preview(@Query('cantidad') cantidad = '1') {
    return this.planes.previewForCantidad(Number(cantidad) || 1);
  }

  @Put('plan-tramos')
  replaceTramos(@Body() dto: ReplacePlanTramosDto) {
    return this.planes.replaceTramos(
      dto.tramos.map((t, i) => ({
        nombre: t.nombre,
        desde: t.desde,
        hasta: t.hasta ?? null,
        precio_usd: t.precio_usd,
        orden: i + 1,
      })),
    );
  }

  @Get('resumen')
  resumen() {
    return this.planes.resumenPlataforma();
  }

  @Get('planes/pendientes')
  pendientes() {
    return this.planes.listPendientesSinConfirmar();
  }

  @Post('clubs/:id/plan/confirmar')
  confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.planes.confirmarClub(id);
  }

  @Post('clubs/:id/plan/reenviar-mail')
  reenviar(@Param('id', ParseIntPipe) id: number) {
    return this.planes.reenviarMail(id);
  }
}
