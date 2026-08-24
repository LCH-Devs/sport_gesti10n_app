import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(2)
  titular_nombre: string;

  @IsString()
  @MinLength(2)
  titular_apellido: string;

  @IsString()
  @MinLength(8)
  cuit: string;

  @IsString()
  @MinLength(8)
  cuil: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono_club?: string;

  @IsOptional()
  @IsEmail()
  email_contacto?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  color_primario?: string;

  @IsOptional()
  @IsString()
  color_secundario?: string | null;

  @IsOptional()
  @IsString()
  color_terciario?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cuota_monto?: number;

  @IsString()
  @MinLength(8)
  nueva_password: string;
}

