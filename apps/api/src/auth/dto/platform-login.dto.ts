import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsAppEmail } from '../../common/dto-constraints';

export class PlatformLoginDto {
  @IsAppEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(72)
  password: string;
}
