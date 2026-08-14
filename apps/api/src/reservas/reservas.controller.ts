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
import { ReservasService } from './reservas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { CreateReservaDto } from './dto/reserva.dto';

@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Get()
  list(
    @ClubId() clubId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('espacio_id') espacioId?: string,
  ) {
    return this.reservas.list(clubId, {
      desde,
      hasta,
      espacio_id: espacioId ? Number(espacioId) : undefined,
    });
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateReservaDto) {
    return this.reservas.create(clubId, dto);
  }

  @Patch(':id/cancelar')
  @UseGuards(AdminRoleGuard)
  cancelar(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservas.cancelar(clubId, id);
  }
}
