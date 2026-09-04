import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  IsCuitCuil,
  IsOptionalColorHex,
  IsPersonName,
  IsStrongPassword,
} from '../../common/dto-constraints';

export class CompleteOnboardingDto {
  @IsPersonName()
  titular_nombre: string;

  @IsPersonName()
  titular_apellido: string;

  @IsCuitCuil()
  cuit_cuil: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  provincia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ciudad?: string;

  @IsOptional()
  @IsObject()
  ubicacion_json?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono_club?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string;

  @IsOptionalColorHex()
  color_primario?: string;

  @IsOptionalColorHex()
  color_secundario?: string | null;

  @IsOptionalColorHex()
  color_terciario?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cuota_monto?: number;

  @IsStrongPassword()
  nueva_password: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  deportes?: string[];

  @IsOptional()
  @IsBoolean()
  bloquear_entrada?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  descuento_familiar_pct?: number;
}
