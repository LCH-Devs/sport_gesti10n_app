import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  titular_nombre: string;

  @IsString()
  @MinLength(2)
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, {
    message: 'El apellido solo puede contener letras y espacios',
  })
  titular_apellido: string;

  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'El CUIT/CUIL debe tener exactamente 11 dígitos',
  })
  cuit_cuil: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsObject()
  ubicacion_json?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  telefono_club?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  color_primario?: string;

  @IsOptional()
  @IsString()
  color_secundario?: string | null;

  @IsOptional()
  @IsString()
  color_terciario?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cuota_monto?: number;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/, {
    message:
      'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & * _ - + =)',
  })
  nueva_password: string;
}
