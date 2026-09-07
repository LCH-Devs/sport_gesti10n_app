import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SociosService } from './socios.service';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubStaffGuard } from '../common/club-staff.guard';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import { CreateSocioDto, UpdateSocioDto } from './dto/socio.dto';
import { buildSocioImportTemplate } from './socios-import';

@Controller('socios')
@UseClubAuth(ClubStaffGuard)
export class SociosController {
  constructor(private readonly socios: SociosService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.socios.list(clubId);
  }

  @Get('import-template')
  @UseGuards(AdminRoleGuard)
  downloadImportTemplate() {
    return new StreamableFile(buildSocioImportTemplate(), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="plantilla-socios.xlsx"',
    });
  }

  @Get(':id')
  getOne(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.socios.getOne(clubId, id);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateSocioDto) {
    return this.socios.create(clubId, dto);
  }

  @Post('import-csv')
  @UseGuards(AdminRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async importCsv(
    @ClubId() clubId: number,
    @UploadedFile() file?: Express.Multer.File,
    @Body('csv') csvBody?: string,
    @Body('acepta_upgrade') aceptaUpgrade?: string | boolean,
  ) {
    return this.socios.importCsv(clubId, {
      csvText: csvBody,
      buffer: file?.buffer,
      filename: file?.originalname,
      acepta_upgrade: aceptaUpgrade === true || aceptaUpgrade === 'true',
    });
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

