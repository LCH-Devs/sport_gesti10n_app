import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
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
  UpdateSelfPlatformAdminDto,
} from './dto/platform.dto';

@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('admins/me')
  getSelf(@Req() req: { user: JwtPayload }) {
    return this.platform.getSelf(req.user.sub);
  }

  @Patch('admins/me')
  updateSelf(
    @Req() req: { user: JwtPayload },
    @Body() dto: UpdateSelfPlatformAdminDto,
  ) {
    return this.platform.updateSelf(req.user.sub, dto);
  }

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

  @Get('clubs/:id/resources/:resource')
  getClubResource(
    @Param('id', ParseIntPipe) id: number,
    @Param('resource') resource: string,
  ) {
    return this.platform.getClubResource(id, resource);
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

  @Delete('clubs/:id')
  deleteClub(@Param('id', ParseIntPipe) id: number) {
    return this.platform.deleteClub(id);
  }

  @Post('clubs/:id/admins')
  addAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateClubAdminDto,
  ) {
    return this.platform.addAdmin(id, dto);
  }
}
