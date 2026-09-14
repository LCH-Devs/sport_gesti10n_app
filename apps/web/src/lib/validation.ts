// Filtros y patrones de validación compartidos por los formularios de gestión.

const PHONE_DISALLOWED = /[^0-9+\-\s()]/g;
const DIGITS_DISALLOWED = /\D/g;
const NAME_DISALLOWED = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g;
const NAME_ALLOWED_FULL = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]*$/;

export const PHONE_PATTERN = '^[0-9+\\-\\s()]*$';
export const DNI_PATTERN = '^[0-9]*$';
export const TIME_PATTERN = '^([01]\\d|2[0-3]):[0-5]\\d$';
export const NAME_PATTERN = "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\\s'-]*$";
export const NAME_HELP = 'Solo letras, espacios, guiones y apóstrofos';

export function filterPhone(value: string): string {
  return value.replace(PHONE_DISALLOWED, '');
}

export function filterDigits(value: string): string {
  return value.replace(DIGITS_DISALLOWED, '');
}

/** Filtra en vivo caracteres inválidos de un nombre/apellido (letras, espacios, guiones y apóstrofos). */
export function filterPersonName(value: string): string {
  return value.replace(NAME_DISALLOWED, '');
}

/** Mensaje de ayuda a mostrar cuando el nombre está vacío o quedó con datos inválidos. */
export function personNameError(value: string): string {
  if (!value.trim()) return 'Este campo es obligatorio';
  if (!NAME_ALLOWED_FULL.test(value)) return NAME_HELP;
  return '';
}
