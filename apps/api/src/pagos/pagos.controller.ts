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
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { GenerarCobrosDto } from './dto/generar-cobros.dto';

@Controller()
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  @Get('pagos/resumen')
  @UseGuards(JwtAuthGuard)
  resumen(@ClubId() clubId: number, @Query('mes') mes?: string) {
    return this.pagos.resumen(clubId, mes);
  }

  @Post('pagos/cobrar-mes')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  cobrarMes(@ClubId() clubId: number, @Body() dto: GenerarCobrosDto) {
    return this.pagos.generarYEnviar(clubId, dto);
  }

  /** Alias del prompt / docs. */
  @Post('api/cuotas/generar-links')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generarLinks(@ClubId() clubId: number, @Body() dto: GenerarCobrosDto) {
    return this.pagos.generarYEnviar(clubId, dto);
  }

  @Patch('pagos/:id/marcar-manual')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  marcarManual(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pagos.marcarManual(clubId, id);
  }

  /** Webhook público (sin JWT). Responder 200 siempre que se pueda. */
  @Post('api/webhook/mp')
  webhook(@Body() body: Record<string, unknown>) {
    return this.pagos.handleWebhook(
      body as { type?: string; action?: string; data?: { id?: string } },
    );
  }
}
