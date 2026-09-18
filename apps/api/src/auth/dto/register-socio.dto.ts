import { IsAppEmail, IsDni, IsPersonName, IsStrongPassword } from '../../common/dto-constraints';
import { IsDateString, IsString, MaxLength } from 'class-validator';

export class RegisterSocioDto {
  @IsString()
  @MaxLength(60)
  club_slug!: string;

  @IsDni()
  dni!: string;

  @IsPersonName()
  nombre!: string;

  @IsPersonName()
  apellido!: string;

  @IsAppEmail()
  email!: string;

  @IsDateString()
  fecha_nacimiento!: string;

  @IsStrongPassword()
  password!: string;
}
