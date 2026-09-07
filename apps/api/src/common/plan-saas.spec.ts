import {
  DEFAULT_PLAN_TRAMOS,
  proximoCiclo,
  proximoTramo,
  tramoParaCantidad,
  validateTramos,
} from './plan-saas';

describe('plan-saas', () => {
  it('elige el tramo por cantidad', () => {
    expect(tramoParaCantidad(DEFAULT_PLAN_TRAMOS, 1).nombre).toBe(
      'Hasta 50 socios',
    );
    expect(tramoParaCantidad(DEFAULT_PLAN_TRAMOS, 50).precio_usd).toBe(15);
    expect(tramoParaCantidad(DEFAULT_PLAN_TRAMOS, 51).nombre).toBe(
      'Hasta 100 socios',
    );
    expect(tramoParaCantidad(DEFAULT_PLAN_TRAMOS, 200).nombre).toBe(
      'Más de 100 socios',
    );
  });

  it('devuelve el siguiente tramo', () => {
    const actual = tramoParaCantidad(DEFAULT_PLAN_TRAMOS, 40);
    expect(proximoTramo(DEFAULT_PLAN_TRAMOS, actual)?.nombre).toBe(
      'Hasta 100 socios',
    );
  });

  it('rechaza huecos entre tramos', () => {
    expect(() =>
      validateTramos([
        { nombre: 'A', desde: 1, hasta: 10, precio_usd: 5, orden: 1 },
        { nombre: 'B', desde: 20, hasta: null, precio_usd: 10, orden: 2 },
      ]),
    ).toThrow(/hueco/);
  });

  it('calcula el próximo ciclo el día 1', () => {
    const next = proximoCiclo(new Date('2026-09-07T15:00:00Z'));
    expect(next.toISOString().slice(0, 10)).toBe('2026-10-01');
  });
});
