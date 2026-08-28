import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubStaffGuard } from '../common/club-staff.guard';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import { CreateAdminDto, UpdateAdminDto, UpdateSelfDto } from './dto/admin.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('admins')
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get('me')
  @UseClubAuth(ClubStaffGuard)
  getSelf(@ClubId() clubId: number, @Req() req: { user: JwtPayload }) {
    return this.admins.getSelf(clubId, req.user.sub);
  }

  @Patch('me')
  @UseClubAuth(ClubStaffGuard)
  updateSelf(
    @ClubId() clubId: number,
    @Req() req: { user: JwtPayload },
    @Body() dto: UpdateSelfDto,
  ) {
    return this.admins.updateSelf(clubId, req.user.sub, dto);
  }

  @Get()
  @UseClubAuth(AdminRoleGuard)
  list(@ClubId() clubId: number) {
    return this.admins.list(clubId);
  }

  @Post()
  @UseClubAuth(AdminRoleGuard)
  create(@ClubId() clubId: number, @Body() dto: CreateAdminDto) {
    return this.admins.create(clubId, dto);
  }

  @Patch(':id')
  @UseClubAuth(AdminRoleGuard)
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.admins.update(clubId, id, dto);
  }

  @Delete(':id')
  @UseClubAuth(AdminRoleGuard)
  remove(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: JwtPayload },
  ) {
    return this.admins.remove(clubId, id, req.user.sub);
  }
}

