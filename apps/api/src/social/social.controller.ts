import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../common/jwt-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { SocialService } from './social.service';
import {
  CreatePublicacionSocialDto,
  ListPublicacionSocialQuery,
  UpdatePublicacionSocialDto,
} from './dto/social.dto';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get('posts')
  list(@Query() query: ListPublicacionSocialQuery) {
    return this.social.listFeed(query);
  }

  @Get('mis-publicaciones')
  mine(@JwtUser() user: JwtPayload) {
    return this.social.listMine(user);
  }

  @Get('posts/:id')
  getOne(@Param('id', ParseIntPipe) id: number, @JwtUser() user: JwtPayload) {
    return this.social.getOne(id, user);
  }

  @Post('posts')
  create(@JwtUser() user: JwtPayload, @Body() dto: CreatePublicacionSocialDto) {
    return this.social.create(user, dto);
  }

  @Patch('posts/:id')
  update(
    @JwtUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePublicacionSocialDto,
  ) {
    return this.social.update(user, id, dto);
  }

  @Delete('posts/:id')
  remove(@JwtUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.social.remove(user, id);
  }
}
