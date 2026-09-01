import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePublicacionSocialDto {
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
  @IsDateString()
  fecha_evento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  /** Solo lo usa el superadmin. El admin del club ignora este campo. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  club_id?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdatePublicacionSocialDto {
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
  imagen_url?: string | null;

  @IsOptional()
  @IsDateString()
  fecha_evento?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string | null;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class ListPublicacionSocialQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  club_id?: number;
}
