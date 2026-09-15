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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventosService } from './eventos.service';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubStaffGuard } from '../common/club-staff.guard';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';

@Controller('eventos')
@UseClubAuth(ClubStaffGuard)
export class EventosController {
  constructor(private readonly eventos: EventosService) {}

  @Get()
  list(@ClubId() clubId: number, @Query('tipo') tipo?: string) {
    return this.eventos.list(clubId, tipo);
  }

  @Post('imagenes')
  @UseGuards(AdminRoleGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 4 * 1024 * 1024 } }))
  uploadImagen(@UploadedFile() file: Express.Multer.File) {
    return this.eventos.uploadImagen(file);
  }

  @Get(':id')
  getOne(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.eventos.getOne(clubId, id);
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateEventoDto) {
    return this.eventos.create(clubId, dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.eventos.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminRoleGuard)
  remove(@ClubId() clubId: number, @Param('id', ParseIntPipe) id: number) {
    return this.eventos.remove(clubId, id);
  }
}
