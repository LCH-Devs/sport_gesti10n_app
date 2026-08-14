import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHorarioDto {
  @IsString()
  titulo: string;

  @IsString()
  dias: string;

  @IsString()
  hora_inicio: string;

  @IsString()
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
  titulo?: string;

  @IsOptional()
  @IsString()
  dias?: string;

  @IsOptional()
  @IsString()
  hora_inicio?: string;

  @IsOptional()
  @IsString()
  hora_fin?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  profe_id?: number | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
