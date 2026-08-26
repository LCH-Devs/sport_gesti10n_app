import { Controller, Get } from '@nestjs/common';
import { SociosService } from './socios.service';
import { ClubId } from '../common/club-id.decorator';
import { JwtUser } from '../common/jwt-user.decorator';
import { SocioRoleGuard } from '../common/socio-role.guard';
import { UseClubAuth } from '../common/use-club-auth';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('socio')
@UseClubAuth(SocioRoleGuard)
export class SocioPortalController {
  constructor(private readonly socios: SociosService) {}

  @Get('me')
  me(@ClubId() clubId: number, @JwtUser() user: JwtPayload) {
    return this.socios.portalMe(clubId, user.sub);
  }
}
