import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTorneoDto {
  @IsString()
  nombre: string;

  @IsString()
  deporte: string;

  @IsOptional()
  @IsString()
  estado?: string;
}

export class UpdateTorneoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  deporte?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}

export class CreatePartidoDto {
  @IsString()
  rival_a: string;

  @IsString()
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

