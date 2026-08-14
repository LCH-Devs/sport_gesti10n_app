import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SociosService } from './socios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { CreateSocioDto, UpdateSocioDto } from './dto/socio.dto';

@Controller('socios')
@UseGuards(JwtAuthGuard)
export class SociosController {
  constructor(private readonly socios: SociosService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.socios.list(clubId);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateSocioDto) {
    return this.socios.create(clubId, dto);
  }

  @Post('import-csv')
  @UseGuards(AdminRoleGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @ClubId() clubId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('csv') csvBody?: string,
  ) {
    const text =
      csvBody ||
      (file ? file.buffer.toString('utf-8') : undefined);
    if (!text) {
      return this.socios.importCsv(clubId, '');
    }
    return this.socios.importCsv(clubId, text);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSocioDto,
  ) {
    return this.socios.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.socios.remove(clubId, id);
  }
}
