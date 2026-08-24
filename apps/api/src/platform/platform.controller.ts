import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformRoleGuard } from '../common/platform-role.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  CreateClubAdminDto,
  CreateClubPlatformDto,
  CreatePlatformAdminDto,
  UpdateClubPlatformDto,
  UpdatePlatformAdminDto,
} from './dto/platform.dto';

@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('clubs')
  listClubs() {
    return this.platform.listClubs();
  }

  @Get('admins')
  listPlatformAdmins() {
    return this.platform.listPlatformAdmins();
  }

  @Post('admins')
  createPlatformAdmin(@Body() dto: CreatePlatformAdminDto) {
    return this.platform.createPlatformAdmin(dto);
  }

  @Patch('admins/:id')
  updatePlatformAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlatformAdminDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.platform.updatePlatformAdmin(id, dto, req.user.sub);
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

