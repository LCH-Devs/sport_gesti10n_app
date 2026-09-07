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
import { CategoriasCuotaService } from './categorias-cuota.service';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubStaffGuard } from '../common/club-staff.guard';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import {
  CreateCategoriaCuotaDto,
  UpdateCategoriaCuotaDto,
} from './dto/categoria-cuota.dto';

@Controller('categorias-cuota')
@UseClubAuth(ClubStaffGuard)
export class CategoriasCuotaController {
  constructor(private readonly categorias: CategoriasCuotaService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.categorias.list(clubId);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateCategoriaCuotaDto) {
    return this.categorias.create(clubId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaCuotaDto,
  ) {
    return this.categorias.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.categorias.remove(clubId, id);
  }
}
