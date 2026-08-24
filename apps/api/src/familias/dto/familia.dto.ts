import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFamiliaDto {
  @IsString()
  nombre: string;

  @Type(() => Number)
  @IsInt()
  titular_id: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  socio_ids?: number[];
}

export class UpdateFamiliaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  titular_id?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  socio_ids?: number[];
}

