import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNoticiaDto {
  @IsString()
  @MaxLength(200)
  titulo: string;

  @IsString()
  @MaxLength(10000)
  cuerpo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagen_url?: string;

  @IsOptional()
  @IsBoolean()
  es_evento?: boolean;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateNoticiaDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  cuerpo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagen_url?: string;

  @IsOptional()
  @IsBoolean()
  es_evento?: boolean;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
