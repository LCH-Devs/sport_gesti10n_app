import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformRoleGuard } from '../common/platform-role.guard';
import {
  CreateClubAdminDto,
  CreateClubPlatformDto,
  UpdateClubPlatformDto,
} from './dto/platform.dto';

@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('clubs')
  listClubs() {
    return this.platform.listClubs();
  }

  @Get('clubs/:id')
  getClub(@Param('id', ParseIntPipe) id: number) {
    return this.platform.getClub(id);
  }

  @Post('clubs')
  createClub(@Body() dto: CreateClubPlatformDto) {
    return this.platform.createClub(dto);
  }

  @Patch('clubs/:id')
  updateClub(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClubPlatformDto,
  ) {
    return this.platform.updateClub(id, dto);
  }

  @Post('clubs/:id/admins')
  addAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateClubAdminDto,
  ) {
    return this.platform.addAdmin(id, dto);
  }
}
