import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsHoraHm, IsOptionalHoraHm } from '../../common/dto-constraints';

export class CreateHorarioDto {
  @IsString()
  @MaxLength(120)
  titulo: string;

  @IsString()
  @MaxLength(80)
  dias: string;

  @IsHoraHm()
  hora_inicio: string;

  @IsHoraHm()
  hora_fin: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  profe_id?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateHorarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dias?: string;

  @IsOptionalHoraHm()
  hora_inicio?: string;

  @IsOptionalHoraHm()
  hora_fin?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  profe_id?: number | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
