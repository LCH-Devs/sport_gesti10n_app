import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('hoy')
  hoy(@ClubId() clubId: number) {
    return this.reportes.hoy(clubId);
  }

  @Get('alerta-fuga')
  alertaFuga(@ClubId() clubId: number) {
    return this.reportes.alertaFuga(clubId);
  }

  @Get('cumpleanos')
  cumpleanos(@ClubId() clubId: number, @Query('mes') mes?: string) {
    return this.reportes.cumpleanos(clubId, mes);
  }

  @Post('cumpleanos/generar-noticias')
  @UseGuards(AdminRoleGuard)
  generarNoticiasCumple(@ClubId() clubId: number) {
    return this.reportes.generarNoticiasCumple(clubId);
  }
}
