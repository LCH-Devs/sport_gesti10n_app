import { Controller, Get, Query } from '@nestjs/common';
import { PlanSaaSService } from './plan-saas.service';

@Controller('public/plan')
export class PlanSaaSPublicController {
  constructor(private readonly planes: PlanSaaSService) {}

  @Get('confirmar')
  confirmar(@Query('token') token = '') {
    return this.planes.confirmarPorToken(token.trim());
  }
}
