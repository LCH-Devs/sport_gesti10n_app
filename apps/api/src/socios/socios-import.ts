import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  isValidDni,
  isValidEmail,
  isValidPersonName,
  isValidTelefono,
  normalizeDni,
} from '../common/dto-constraints';

export const IMPORT_MAX_ROWS = 500;

export type SocioImportRow = {
  line: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: 'socio' | 'profe';
  fecha_nacimiento: string;
  categoria: string;
};

export type SocioImportParsed = {
  rows: SocioImportRow[];
  errors: string[];
};

const REQUIRED_HEADERS = [
  'dni',
  'nombre',
  'apellido',
  'email',
  'fecha_nacimiento',
  'rol',
] as const;

export const SOCIO_IMPORT_TEMPLATE_HEADERS = [
  ...REQUIRED_HEADERS,
  'telefono',
  'categoria',
] as const;

const SOCIO_IMPORT_TEMPLATE_EXAMPLE = [
  '30111222',
  'Carlos',
  'Gomez',
  'carlos@mail.com',
  '14/08/1990',
  'socio',
  '1155550000',
  'Socio pleno',
];

/** Plantilla xlsx con las columnas de importación y una fila de ejemplo. */
export function buildSocioImportTemplate(): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [...SOCIO_IMPORT_TEMPLATE_HEADERS],
    SOCIO_IMPORT_TEMPLATE_EXAMPLE,
  ]);
  ws['!cols'] = SOCIO_IMPORT_TEMPLATE_HEADERS.map((header) => ({
    wch: Math.max(18, header.length + 4),
  }));
  XLSX.utils.book_append_sheet(wb, ws, 'Socios');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function normalizeHeader(raw: string) {
  return raw
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function detectDelimiter(headerLine: string): string {
  const comma = (headerLine.match(/,/g) || []).length;
  const semi = (headerLine.match(/;/g) || []).length;
  const tab = (headerLine.match(/\t/g) || []).length;
  if (tab > comma && tab > semi) return '\t';
  if (semi > comma) return ';';
  return ',';
}

export function parseCsvLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function looksLikeSpreadsheet(buffer: Buffer) {
  if (buffer.length < 4) return false;
  const zip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const ole =
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;
  return zip || ole;
}

function rowsFromSpreadsheet(buffer: Buffer): string[][] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new BadRequestException('El Excel no tiene hojas');
  }
  const sheet = workbook.Sheets[sheetName];
  const table = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });
  return table.map((row) => row.map((cell) => String(cell ?? '').trim()));
}

function rowsFromCsv(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\0/g, '');
  if (looksLikeSpreadsheet(Buffer.from(cleaned.slice(0, 8), 'latin1'))) {
    throw new BadRequestException(
      'Ese archivo es Excel. Subilo como .xlsx; no lo pegues como texto.',
    );
  }
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => parseCsvLine(line, delimiter).map((c) => c.trim()));
}

function cell(row: string[], idx: number) {
  return (row[idx] ?? '').trim();
}

function firstHeader(header: string[], names: string[]) {
  for (const name of names) {
    const idx = header.indexOf(name);
    if (idx >= 0) return idx;
  }
  return -1;
}

function isPlausibleBirthDate(date: Date) {
  const year = date.getUTCFullYear();
  if (year < 1900) return false;
  const today = new Date();
  const utcToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return date.getTime() <= utcToday;
}

function makeUtcDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return isPlausibleBirthDate(date) ? date : null;
}

/** Acepta 14/08/1990, 14-08-90, 1990-08-14, 14.08.1990, serial Excel, etc. */
export function parseFlexibleBirthDate(raw: string): Date | null {
  const token = raw.trim().split(/[T\s]/)[0]?.replace(/,/g, '') ?? '';
  if (!token) return null;

  if (/^\d{5}$/.test(token)) {
    const serial = Number(token);
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return isPlausibleBirthDate(date) ? date : null;
  }

  const iso = token.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (iso) {
    return makeUtcDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const dmy = token.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (!dmy) return null;
  let day = Number(dmy[1]);
  let month = Number(dmy[2]);
  let year = Number(dmy[3]);
  if (year < 100) year += year >= 30 ? 1900 : 2000;
  if (month > 12 && day <= 12) {
    const swap = day;
    day = month;
    month = swap;
  }
  return makeUtcDate(year, month, day);
}

function parseRol(raw: string, line: number): 'socio' | 'profe' | string {
  const value = raw.trim().toLowerCase();
  if (!value) {
    return `Fila ${line}: rol obligatorio (socio o profe)`;
  }
  if (value === 'socio') return 'socio';
  if (value === 'profe' || value === 'profesor' || value === 'profesora') {
    return 'profe';
  }
  return `Fila ${line}: rol inválido (socio o profe)`;
}

function validateRow(
  line: number,
  raw: {
    dni: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    rol: string;
    fecha_nacimiento: string;
    categoria: string;
  },
): SocioImportRow | string {
  if (!raw.dni || !raw.nombre || !raw.apellido || !raw.email || !raw.fecha_nacimiento.trim() || !raw.rol.trim()) {
    return `Fila ${line}: datos incompletos (dni, nombre, apellido, email, fecha de nacimiento y rol son obligatorios)`;
  }
  const dni = normalizeDni(raw.dni);
  if (!isValidDni(dni)) {
    return `Fila ${line}: DNI inválido (7 u 8 dígitos)`;
  }
  if (!isValidPersonName(raw.nombre)) {
    return `Fila ${line}: nombre inválido (solo letras y espacios, 2 a 80 caracteres)`;
  }
  if (!isValidPersonName(raw.apellido)) {
    return `Fila ${line}: apellido inválido (solo letras y espacios, 2 a 80 caracteres)`;
  }
  const email = raw.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return `Fila ${line}: email inválido`;
  }
  if (!isValidTelefono(raw.telefono)) {
    return `Fila ${line}: teléfono inválido`;
  }
  const rol = parseRol(raw.rol, line);
  if (rol !== 'socio' && rol !== 'profe') {
    return rol;
  }
  const parsedFecha = parseFlexibleBirthDate(raw.fecha_nacimiento);
  if (!parsedFecha) {
    return `Fila ${line}: fecha de nacimiento inválida (ej. 14/08/1990 o 1990-08-14)`;
  }
  const fecha_nacimiento = parsedFecha.toISOString().slice(0, 10);
  return {
    line,
    dni,
    nombre: raw.nombre.trim(),
    apellido: raw.apellido.trim(),
    email,
    telefono: raw.telefono.trim(),
    rol,
    fecha_nacimiento,
    categoria: raw.categoria.trim(),
  };
}

export function parseSocioImportTable(table: string[][]): SocioImportParsed {
  if (table.length < 2) {
    throw new BadRequestException('Archivo vacío o sin filas de datos');
  }
  if (table.length - 1 > IMPORT_MAX_ROWS) {
    throw new BadRequestException(
      `Máximo ${IMPORT_MAX_ROWS} filas por importación`,
    );
  }

  const header = table[0].map(normalizeHeader);
  const idx = {
    dni: header.indexOf('dni'),
    nombre: header.indexOf('nombre'),
    apellido: header.indexOf('apellido'),
    email: header.indexOf('email'),
    telefono: firstHeader(header, ['telefono', 'tel']),
    rol: firstHeader(header, ['rol', 'role']),
    fecha_nacimiento: firstHeader(header, [
      'fecha_nacimiento',
      'fecha-nacimiento',
      'fecha de nacimiento',
      'fecha nacimiento',
      'nacimiento',
      'fechanacimiento',
    ]),
    categoria: firstHeader(header, [
      'categoria',
      'categoría',
      'tipo',
      'tipo_socio',
    ]),
  };
  if (REQUIRED_HEADERS.some((key) => idx[key] < 0)) {
    throw new BadRequestException(
      'Cabecera requerida: dni,nombre,apellido,email,fecha_nacimiento,rol[,telefono,categoria]',
    );
  }

  const rows: SocioImportRow[] = [];
  const errors: string[] = [];
  const dniInFile = new Map<string, number>();
  const emailInFile = new Map<string, number>();

  for (let i = 1; i < table.length; i++) {
    const line = i + 1;
    const parsed = validateRow(line, {
      dni: cell(table[i], idx.dni),
      nombre: cell(table[i], idx.nombre),
      apellido: cell(table[i], idx.apellido),
      email: cell(table[i], idx.email),
      telefono: idx.telefono >= 0 ? cell(table[i], idx.telefono) : '',
      rol: idx.rol >= 0 ? cell(table[i], idx.rol) : '',
      fecha_nacimiento:
        idx.fecha_nacimiento >= 0 ? cell(table[i], idx.fecha_nacimiento) : '',
      categoria: idx.categoria >= 0 ? cell(table[i], idx.categoria) : '',
    });
    if (typeof parsed === 'string') {
      errors.push(parsed);
      continue;
    }
    const dniDup = dniInFile.get(parsed.dni);
    if (dniDup) {
      errors.push(`Fila ${line}: DNI duplicado en el archivo (fila ${dniDup})`);
      continue;
    }
    const emailDup = emailInFile.get(parsed.email);
    if (emailDup) {
      errors.push(
        `Fila ${line}: email duplicado en el archivo (fila ${emailDup})`,
      );
      continue;
    }
    dniInFile.set(parsed.dni, line);
    emailInFile.set(parsed.email, line);
    rows.push(parsed);
  }

  return { rows, errors };
}

export function parseSocioImportSource(input: {
  csvText?: string;
  buffer?: Buffer;
  filename?: string;
}): SocioImportParsed {
  const filename = (input.filename || '').toLowerCase();
  if (filename && !/\.(csv|txt|xlsx|xls)$/.test(filename)) {
    throw new BadRequestException(
      'Formato no soportado. Usá CSV o Excel (.xlsx / .xls)',
    );
  }

  let table: string[][];
  if (input.buffer?.length) {
    if (looksLikeSpreadsheet(input.buffer) || /\.(xlsx|xls)$/.test(filename)) {
      table = rowsFromSpreadsheet(input.buffer);
    } else {
      table = rowsFromCsv(input.buffer.toString('utf-8'));
    }
  } else if (input.csvText?.trim()) {
    table = rowsFromCsv(input.csvText);
  } else {
    throw new BadRequestException('CSV vacío o sin filas de datos');
  }

  return parseSocioImportTable(table);
}
