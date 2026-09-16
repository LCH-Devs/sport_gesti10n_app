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
/** Portal socio: igual que CreateReservaDto pero sin socio_id — lo pone el backend. */
export class CreateReservaSelfDto {
  @Type(() => Number)
  @IsInt()
  espacio_id: number;

  @IsDateString()
  inicio: string;

  @IsDateString()
  fin: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nota?: string;
}

export class UpdateReservaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  espacio_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  socio_id?: number;

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nota?: string;
}
