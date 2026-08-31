import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservaDto {
  @Type(() => Number)
  @IsInt()
  espacio_id: number;

  @Type(() => Number)
  @IsInt()
  socio_id: number;

  @IsDateString()
  inicio: string;

  @IsDateString()
  fin: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nota?: string;
}
