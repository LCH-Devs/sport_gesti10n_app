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
import { FamiliasService } from './familias.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { CreateFamiliaDto, UpdateFamiliaDto } from './dto/familia.dto';

@Controller('familias')
@UseGuards(JwtAuthGuard)
export class FamiliasController {
  constructor(private readonly familias: FamiliasService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.familias.list(clubId);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateFamiliaDto) {
    return this.familias.create(clubId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFamiliaDto,
  ) {
    return this.familias.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.familias.remove(clubId, id);
  }
}
