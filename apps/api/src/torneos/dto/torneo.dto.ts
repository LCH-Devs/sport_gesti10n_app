import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTorneoDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsString()
  @MaxLength(60)
  deporte: string;

  @IsOptional()
  @IsIn(['activo', 'cerrado', 'finalizado'])
  estado?: string;
}

export class UpdateTorneoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  deporte?: string;

  @IsOptional()
  @IsIn(['activo', 'cerrado', 'finalizado'])
  estado?: string;
}

export class CreatePartidoDto {
  @IsString()
  @MaxLength(80)
  rival_a: string;

  @IsString()
  @MaxLength(80)
  rival_b: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export class UpdateResultadoDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  goles_a: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  goles_b: number;

  @IsOptional()
  @IsBoolean()
  jugado?: boolean;
}
