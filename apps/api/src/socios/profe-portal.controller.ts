import { Controller, Get } from '@nestjs/common';
import { SociosService } from './socios.service';
import { ClubId } from '../common/club-id.decorator';
import { JwtUser } from '../common/jwt-user.decorator';
import { ProfeRoleGuard } from '../common/profe-role.guard';
import { UseClubAuth } from '../common/use-club-auth';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('profe')
@UseClubAuth(ProfeRoleGuard)
export class ProfePortalController {
  constructor(private readonly socios: SociosService) {}

  @Get('me')
  me(@ClubId() clubId: number, @JwtUser() user: JwtPayload) {
    return this.socios.portalProfe(clubId, user.sub);
  }
}
