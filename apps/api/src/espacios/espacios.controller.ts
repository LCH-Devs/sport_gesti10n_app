import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EspaciosService } from './espacios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { CreateEspacioDto, UpdateEspacioDto } from './dto/espacio.dto';

@Controller('espacios')
@UseGuards(JwtAuthGuard)
export class EspaciosController {
  constructor(private readonly espacios: EspaciosService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.espacios.list(clubId);
  }

  @Get(':id/disponibilidad')
  disponibilidad(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('fecha') fecha: string,
  ) {
    return this.espacios.disponibilidad(clubId, id, fecha);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateEspacioDto) {
    return this.espacios.create(clubId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspacioDto,
  ) {
    return this.espacios.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.espacios.remove(clubId, id);
  }
}

