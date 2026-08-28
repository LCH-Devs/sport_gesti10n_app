import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  MinLength,
} from 'class-validator';

export class CreateSocioDto {
  @IsString()
  dni: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsString()
  rol?: string;

  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;
}

export class UpdateSelfSocioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  newPassword?: string;
}

export class UpdateSocioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  rol?: string;

  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;
}

