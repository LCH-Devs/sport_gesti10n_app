import {
  addMonthsYm,
  aplicarDescuentoFamiliar,
  armarLotesCuota,
  estadoCuotaMes,
  splitMonto,
} from './cobros-cuota';

describe('cobros-cuota', () => {
  it('parte el monto en cuotas y deja el resto en la última', () => {
    expect(splitMonto(1000, 3)).toEqual([333.33, 333.33, 333.34]);
    expect(splitMonto(100, 1)).toEqual([100]);
  });

  it('aplica el % familiar', () => {
    expect(aplicarDescuentoFamiliar(10000, 10)).toBe(9000);
    expect(aplicarDescuentoFamiliar(10000, 0)).toBe(10000);
  });

  it('avanza meses YYYY-MM', () => {
    expect(addMonthsYm('2026-11', 2)).toBe('2027-01');
  });

  it('agrupa la familia en un solo lote al titular', () => {
    const lotes = armarLotesCuota(
      [
        {
          id: 1,
          email: 'titular@mail.com',
          grupo_familiar_id: 9,
          grupo_nombre: 'Pérez',
          titular_id: 1,
          monto: 5000,
        },
        {
          id: 2,
          email: 'hijo@mail.com',
          grupo_familiar_id: 9,
          grupo_nombre: 'Pérez',
          titular_id: 1,
          monto: 3000,
        },
        {
          id: 3,
          email: 'solo@mail.com',
          grupo_familiar_id: null,
          grupo_nombre: null,
          titular_id: null,
          monto: 4000,
        },
      ],
      { mes: '2026-09', descuentoFamiliarPct: 10, bonificados: new Set() },
    );

    expect(lotes).toHaveLength(2);
    expect(lotes[0]).toMatchObject({
      socio_id: 1,
      grupo_familiar_id: 9,
      monto: 7200,
      concepto: 'Pérez · 2 socios',
    });
    expect(lotes[1]).toMatchObject({
      socio_id: 3,
      monto: 4000,
      concepto: 'Cuota 2026-09',
    });
  });

  it('no cobra a quien tiene el mes bonificado', () => {
    const lotes = armarLotesCuota(
      [
        {
          id: 1,
          email: 'a@mail.com',
          grupo_familiar_id: null,
          grupo_nombre: null,
          titular_id: null,
          monto: 5000,
        },
      ],
      {
        mes: '2026-09',
        descuentoFamiliarPct: 0,
        bonificados: new Set([1]),
      },
    );
    expect(lotes).toEqual([]);
  });

  it('si un miembro de la familia está bonificado, no entra en la suma', () => {
    const lotes = armarLotesCuota(
      [
        {
          id: 1,
          email: 'titular@mail.com',
          grupo_familiar_id: 9,
          grupo_nombre: 'Pérez',
          titular_id: 1,
          monto: 5000,
        },
        {
          id: 2,
          email: 'hijo@mail.com',
          grupo_familiar_id: 9,
          grupo_nombre: 'Pérez',
          titular_id: 1,
          monto: 3000,
        },
      ],
      {
        mes: '2026-09',
        descuentoFamiliarPct: 10,
        bonificados: new Set([2]),
      },
    );
    expect(lotes).toHaveLength(1);
    expect(lotes[0].monto).toBe(5000);
    expect(lotes[0].concepto).toBe('Pérez · 1 socio');
  });

  it('resuelve el estado de cuota del mes', () => {
    expect(estadoCuotaMes({ pagoEstado: 'pagado', bonificado: true })).toBe(
      'pagado',
    );
    expect(estadoCuotaMes({ pagoEstado: 'pendiente', bonificado: false })).toBe(
      'pendiente',
    );
    expect(estadoCuotaMes({ pagoEstado: null, bonificado: true })).toBe(
      'bonificado',
    );
    expect(estadoCuotaMes({ pagoEstado: null, bonificado: false })).toBe(
      'sin_generar',
    );
  });
});
