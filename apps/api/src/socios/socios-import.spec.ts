import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  IMPORT_MAX_ROWS,
  buildSocioImportTemplate,
  parseCsvLine,
  parseSocioImportSource,
  parseSocioImportTable,
} from './socios-import';

describe('parseSocioImport', () => {
  it('acepta CSV con coma y normaliza DNI con puntos', () => {
    const csv = [
      'dni,nombre,apellido,email,telefono,fecha_nacimiento,rol',
      '30.111.222,Carlos,Gomez,carlos@mail.com,1155550000,14/08/1990,socio',
    ].join('\n');

    const result = parseSocioImportSource({ csvText: csv });
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      expect.objectContaining({
        line: 2,
        dni: '30111222',
        nombre: 'Carlos',
        apellido: 'Gomez',
        email: 'carlos@mail.com',
        telefono: '1155550000',
        rol: 'socio',
        fecha_nacimiento: '1990-08-14',
      }),
    ]);
  });

  it('acepta CSV de Excel Argentina con punto y coma y BOM', () => {
    const csv =
      '\uFEFFdni;nombre;apellido;email;rol;fecha_nacimiento\n30111222;Ana;Garcia;ana@mail.com;profe;20/03/1992';
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      email: 'ana@mail.com',
      rol: 'profe',
      fecha_nacimiento: '1992-03-20',
    });
  });

  it('acepta cabecera Teléfono con tilde', () => {
    const csv =
      'dni,nombre,apellido,email,teléfono,fecha_nacimiento,rol\n30111222,Ana,Garcia,ana@mail.com,3412222222,02/11/1985,socio';
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.errors).toEqual([]);
    expect(result.rows[0].telefono).toBe('3412222222');
  });

  it('rechaza email inválido, teléfono inválido y DNI duplicado en el archivo', () => {
    const csv = [
      'dni,nombre,apellido,email,telefono,fecha_nacimiento,rol',
      '30111222,Carlos,Gomez,no-es-mail,1155550000,14/08/1990,socio',
      '30222333,Ana,Garcia,ana@mail.com,abc,20/03/1992,socio',
      '30111222,Luis,Perez,luis@mail.com,1155550001,02/11/1985,socio',
      '30111222,Juan,Perez,juan@mail.com,1155550002,14/08/1990,socio',
    ].join('\n');
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].email).toBe('luis@mail.com');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('email inválido'),
        expect.stringContaining('teléfono inválido'),
        expect.stringContaining('DNI duplicado'),
      ]),
    );
  });

  it('exige cabecera mínima', () => {
    expect(() =>
      parseSocioImportSource({
        csvText: 'nombre,email\nAna,ana@mail.com',
      }),
    ).toThrow(BadRequestException);
  });

  it('exige columna fecha de nacimiento y rol', () => {
    expect(() =>
      parseSocioImportSource({
        csvText:
          'dni,nombre,apellido,email,fecha_nacimiento\n30111222,Carlos,Gomez,carlos@mail.com,14/08/1990',
      }),
    ).toThrow(BadRequestException);
  });

  it('rechaza fila sin fecha de nacimiento', () => {
    const csv = [
      'dni,nombre,apellido,email,fecha_nacimiento,rol',
      '30111222,Carlos,Gomez,carlos@mail.com,,socio',
    ].join('\n');
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toContain(
      'dni, nombre, apellido, email, fecha de nacimiento y rol son obligatorios',
    );
  });

  it('rechaza fila sin rol', () => {
    const csv = [
      'dni,nombre,apellido,email,fecha_nacimiento,rol',
      '30111222,Carlos,Gomez,carlos@mail.com,14/08/1990,',
    ].join('\n');
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toContain(
      'dni, nombre, apellido, email, fecha de nacimiento y rol son obligatorios',
    );
  });

  it('parsea Excel xlsx', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['dni', 'nombre', 'apellido', 'email', 'fecha_nacimiento', 'rol'],
      ['30333444', 'Luis', 'Profe', 'profe@mail.com', '14/08/1990', 'profe'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Socios');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const result = parseSocioImportSource({
      buffer,
      filename: 'socios.xlsx',
    });
    expect(result.errors).toEqual([]);
    expect(result.rows[0].email).toBe('profe@mail.com');
    expect(result.rows[0].fecha_nacimiento).toBe('1990-08-14');
    expect(result.rows[0].rol).toBe('profe');
  });

  it('respeta el tope de filas', () => {
    const header = [
      'dni',
      'nombre',
      'apellido',
      'email',
      'fecha_nacimiento',
      'rol',
    ];
    const table = [
      header,
      ...Array.from({ length: IMPORT_MAX_ROWS + 1 }, (_, i) => [
        String(30000000 + i),
        'Ana',
        'Garcia',
        `ana${i}@mail.com`,
        '14/08/1990',
        'socio',
      ]),
    ];
    expect(() => parseSocioImportTable(table)).toThrow(BadRequestException);
  });

  it('parsea fecha de nacimiento con /, - y ISO', () => {
    const csv = [
      'dni,nombre,apellido,email,fecha_nacimiento,rol',
      '30111222,Carlos,Gomez,carlos@mail.com,14/08/1990,socio',
      '30222333,Ana,Garcia,ana@mail.com,1990-03-20,profe',
      '30333444,Luis,Perez,luis@mail.com,2-11-85,socio',
    ].join('\n');
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.errors).toEqual([]);
    expect(result.rows.map((r) => r.fecha_nacimiento)).toEqual([
      '1990-08-14',
      '1990-03-20',
      '1985-11-02',
    ]);
  });

  it('acepta cabecera Fecha de nacimiento y rechaza fecha inválida', () => {
    const csv = [
      'dni,nombre,apellido,email,Fecha de nacimiento,rol',
      '30111222,Carlos,Gomez,carlos@mail.com,32/01/1990,socio',
    ].join('\n');
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toContain('fecha de nacimiento inválida');
  });

  it('parseCsvLine respeta comillas', () => {
    expect(parseCsvLine('30111222,"Gomez, Carlos",Gomez,a@b.com', ',')).toEqual([
      '30111222',
      'Gomez, Carlos',
      'Gomez',
      'a@b.com',
    ]);
  });

  it('la plantilla Excel se puede importar', () => {
    const buffer = buildSocioImportTemplate();
    const result = parseSocioImportSource({
      buffer,
      filename: 'plantilla-socios.xlsx',
    });
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      dni: '30111222',
      nombre: 'Carlos',
      apellido: 'Gomez',
      email: 'carlos@mail.com',
      fecha_nacimiento: '1990-08-14',
      rol: 'socio',
      telefono: '1155550000',
      categoria: 'Socio pleno',
    });
  });

  it('deja categoría vacía para que el back use Socio pleno', () => {
    const csv = [
      'dni,nombre,apellido,email,fecha_nacimiento,rol,categoria',
      '30111222,Carlos,Gomez,carlos@mail.com,14/08/1990,socio,',
    ].join('\n');
    const result = parseSocioImportSource({ csvText: csv });
    expect(result.errors).toEqual([]);
    expect(result.rows[0].categoria).toBe('');
  });
});
