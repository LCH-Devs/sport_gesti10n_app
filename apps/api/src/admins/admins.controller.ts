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
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('admins')
@UseClubAuth(AdminRoleGuard)
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get()
  list(@ClubId() clubId: number) {
    return this.admins.list(clubId);
  }

  @Post()
  create(@ClubId() clubId: number, @Body() dto: CreateAdminDto) {
    return this.admins.create(clubId, dto);
  }

  @Patch(':id')
  update(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.admins.update(clubId, id, dto);
  }

  @Delete(':id')
  remove(
    @ClubId() clubId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: JwtPayload },
  ) {
    return this.admins.remove(clubId, id, req.user.sub);
  }
}

