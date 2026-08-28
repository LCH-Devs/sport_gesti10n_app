import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SociosService } from './socios.service';
import { ClubId } from '../common/club-id.decorator';
import { JwtUser } from '../common/jwt-user.decorator';
import { SocioRoleGuard } from '../common/socio-role.guard';
import { UseClubAuth } from '../common/use-club-auth';
import { JwtPayload } from '../auth/jwt.strategy';
import { UpdateSelfSocioDto } from './dto/socio.dto';

@Controller('socio')
@UseClubAuth(SocioRoleGuard)
export class SocioPortalController {
  constructor(private readonly socios: SociosService) {}

  @Get('me')
  me(@ClubId() clubId: number, @JwtUser() user: JwtPayload) {
    return this.socios.portalMe(clubId, user.sub);
  }

  @Patch('me')
  updateMe(
    @ClubId() clubId: number,
    @JwtUser() user: JwtPayload,
    @Body() dto: UpdateSelfSocioDto,
  ) {
    return this.socios.updateSelf(clubId, user.sub, dto);
  }
}
