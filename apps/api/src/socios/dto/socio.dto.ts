import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  IsAppEmail,
  IsDni,
  IsOptionalPersonName,
  IsOptionalStrongPassword,
  IsPersonName,
} from '../../common/dto-constraints';
import { AltaCobrosFields } from '../../pagos/dto/alta-cobros.dto';

export class CreateSocioDto extends AltaCobrosFields {
  @IsDni()
  dni: string;

  @IsPersonName()
  nombre: string;

  @IsPersonName()
  apellido: string;

  @IsAppEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptionalStrongPassword()
  password?: string;

  @IsIn(['socio', 'profe'])
  rol!: string;

  @IsDateString()
  fecha_nacimiento!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  acepta_upgrade?: boolean;
}

export class UpdateSelfSocioDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptionalPersonName()
  apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  currentPassword?: string;

  @IsOptionalStrongPassword()
  newPassword?: string;
}

export class UpdateSocioDto {
  @IsOptionalPersonName()
  nombre?: string;

  @IsOptionalPersonName()
  apellido?: string;

  @IsOptional()
  @IsAppEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsIn(['activo', 'moroso', 'suspendido'])
  estado?: string;

  @IsOptional()
  @IsIn(['socio', 'profe'])
  rol?: string;

  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;
}
