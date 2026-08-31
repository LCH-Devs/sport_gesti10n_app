import { applyDecorators } from '@nestjs/common';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;
export const PASSWORD_MESSAGE =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & * _ - + =)';

export const DNI_REGEX = /^\d{7,8}$/;
export const DNI_MESSAGE = 'El DNI debe tener 7 u 8 dígitos';

export const CUIT_REGEX = /^\d{11}$/;
export const CUIT_MESSAGE = 'El CUIT/CUIL debe tener exactamente 11 dígitos';

export const PERSON_NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
export const PERSON_NAME_MESSAGE =
  'El nombre solo puede contener letras y espacios';

export const MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
export const MES_MESSAGE = 'El mes debe ser YYYY-MM';

export const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const HORA_MESSAGE = 'La hora debe ser HH:mm (00:00 a 23:59)';

export const COLOR_HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;
export const COLOR_HEX_MESSAGE = 'El color debe ser #RRGGBB';

export function IsAppEmail() {
  return applyDecorators(IsEmail(), MaxLength(254));
}

export function IsPersonName() {
  return applyDecorators(
    IsString(),
    MinLength(2),
    MaxLength(80),
    Matches(PERSON_NAME_REGEX, { message: PERSON_NAME_MESSAGE }),
  );
}

export function IsOptionalPersonName() {
  return applyDecorators(
    ValidateIf((_, v) => v != null && v !== ''),
    IsPersonName(),
  );
}

export function IsDni() {
  return applyDecorators(
    IsString(),
    Matches(DNI_REGEX, { message: DNI_MESSAGE }),
  );
}

export function IsCuitCuil() {
  return applyDecorators(
    IsString(),
    Matches(CUIT_REGEX, { message: CUIT_MESSAGE }),
  );
}

export function IsStrongPassword() {
  return applyDecorators(
    IsString(),
    MaxLength(72),
    Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE }),
  );
}

export function IsOptionalStrongPassword() {
  return applyDecorators(
    ValidateIf((_, v) => v != null && v !== ''),
    IsStrongPassword(),
  );
}

export function IsMesYm() {
  return applyDecorators(
    IsString(),
    Matches(MES_REGEX, { message: MES_MESSAGE }),
  );
}

export function IsOptionalMesYm() {
  return applyDecorators(
    ValidateIf((_, v) => v != null && v !== ''),
    IsMesYm(),
  );
}

export function IsHoraHm() {
  return applyDecorators(
    IsString(),
    Matches(HORA_REGEX, { message: HORA_MESSAGE }),
  );
}

export function IsOptionalHoraHm() {
  return applyDecorators(
    ValidateIf((_, v) => v != null && v !== ''),
    IsHoraHm(),
  );
}

export function IsOptionalColorHex() {
  return applyDecorators(
    ValidateIf((_, v) => v != null && v !== ''),
    IsString(),
    Matches(COLOR_HEX_REGEX, { message: COLOR_HEX_MESSAGE }),
  );
}

export function isValidDni(dni: string) {
  return DNI_REGEX.test(dni);
}

export function isValidPersonName(name: string) {
  return PERSON_NAME_REGEX.test(name) && name.trim().length >= 2;
}
