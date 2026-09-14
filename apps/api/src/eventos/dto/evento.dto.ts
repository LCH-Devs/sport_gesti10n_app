import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const TIPOS = ['seminario', 'torneo', 'social'] as const;
const VISIBILIDADES = ['publico', 'privado'] as const;

export class CreateEventoDto {
  @IsString()
  @MaxLength(120)
  titulo: string;

  @IsIn(TIPOS)
  tipo: (typeof TIPOS)[number];

  @IsOptional()
  @IsIn(VISIBILIDADES)
  visibilidad?: (typeof VISIBILIDADES)[number];

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @IsOptional()
  @IsInt()
  torneo_id?: number;
}

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titulo?: string;

  @IsOptional()
  @IsIn(TIPOS)
  tipo?: (typeof TIPOS)[number];

  @IsOptional()
  @IsIn(VISIBILIDADES)
  visibilidad?: (typeof VISIBILIDADES)[number];

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;

  @IsOptional()
  @IsInt()
  torneo_id?: number;
}
