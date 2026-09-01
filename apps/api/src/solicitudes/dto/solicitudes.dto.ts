import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  IsAppEmail,
  IsPersonName,
  IsTelefono,
} from '../../common/dto-constraints';
import { ESTADOS_SOLICITUD } from '../solicitudes.constants';

export class CreateSolicitudDto {
  @IsPersonName()
  nombre: string;

  @IsPersonName()
  apellido: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre_club: string;

  @IsAppEmail()
  email: string;

  @IsTelefono()
  telefono: string;

  @IsInt()
  @Min(0)
  @Max(99999)
  @Type(() => Number)
  cantidad_miembros: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99999)
  @Type(() => Number)
  cantidad_socios?: number;
}

export class UpdateSolicitudDto {
  @IsOptional()
  @IsIn([...ESTADOS_SOLICITUD])
  estado?: (typeof ESTADOS_SOLICITUD)[number];
}

export class ListSolicitudQuery {
  @IsOptional()
  @IsIn([...ESTADOS_SOLICITUD])
  estado?: (typeof ESTADOS_SOLICITUD)[number];
}
