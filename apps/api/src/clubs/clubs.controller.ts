import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClubsService } from './clubs.service';
import { AdminRoleGuard } from '../common/admin-role.guard';
import { ClubStaffGuard } from '../common/club-staff.guard';
import { ClubId } from '../common/club-id.decorator';
import { UseClubAuth } from '../common/use-club-auth';
import { UpdateClubConfigDto } from './dto/update-club-config.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { JwtPayload } from '../auth/jwt.strategy';

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

  @UseClubAuth(ClubStaffGuard)
  @Get('me')
  me(@ClubId() clubId: number) {
    return this.clubs.findById(clubId);
  }

  @UseClubAuth(AdminRoleGuard)
  @Patch('me')
  updateMe(@ClubId() clubId: number, @Body() dto: UpdateClubConfigDto) {
    return this.clubs.updateConfig(clubId, dto);
  }

  @UseClubAuth(AdminRoleGuard)
  @Post('me/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadLogo(
    @ClubId() clubId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.clubs.uploadLogo(clubId, file);
  }

  @UseClubAuth(AdminRoleGuard)
  @Patch('me/onboarding')
  completeOnboarding(
    @ClubId() clubId: number,
    @Req() req: { user: JwtPayload },
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.clubs.completeOnboarding(clubId, req.user.sub, dto);
  }
}

