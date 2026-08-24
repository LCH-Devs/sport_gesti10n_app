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
import { NoticiasService } from './noticias.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { CreateNoticiaDto, UpdateNoticiaDto } from './dto/noticia.dto';

@Controller('noticias')
@UseGuards(JwtAuthGuard)
export class NoticiasController {
  constructor(private readonly noticias: NoticiasService) {}

  @Get()
  list(@ClubId() clubId: number, @Query('es_evento') esEvento?: string) {
    const flag =
      esEvento === undefined
        ? undefined
        : esEvento === 'true' || esEvento === '1';
    return this.noticias.list(clubId, flag);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateNoticiaDto) {
    return this.noticias.create(clubId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoticiaDto,
  ) {
    return this.noticias.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.noticias.remove(clubId, id);
  }
}

