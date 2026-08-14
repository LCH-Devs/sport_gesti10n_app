import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubId } from '../common/club-id.decorator';
import { UpdateClubConfigDto } from './dto/update-club-config.dto';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get('buscar')
  buscar(@Query('q') q = '') {
    return this.clubs.buscar(q);
  }

  @Get('slug/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.clubs.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@ClubId() clubId: number) {
    return this.clubs.findById(clubId);
  }

  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Patch('me')
  updateMe(@ClubId() clubId: number, @Body() dto: UpdateClubConfigDto) {
    return this.clubs.updateConfig(clubId, dto);
  }
}
