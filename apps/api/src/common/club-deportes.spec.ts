import { normalizeDeportes } from './club-deportes';

describe('normalizeDeportes', () => {
  it('recorta, ignora vacíos y deduplica sin importar mayúsculas', () => {
    expect(normalizeDeportes([' padel ', '', 'Padel', 'futbol'])).toEqual([
      'padel',
      'futbol',
    ]);
  });

  it('deja array vacío si no hay valores útiles', () => {
    expect(normalizeDeportes(['', '  '])).toEqual([]);
  });
});
