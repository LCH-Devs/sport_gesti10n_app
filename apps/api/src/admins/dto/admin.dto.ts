import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  nombre: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsOptional()
  @IsIn(['admin', 'entrada'])
  rol?: string;
}

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsIn(['admin', 'entrada'])
  rol?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
