import {
  adminEmailInUseWhere,
  clubNombreInUseWhere,
} from './club-users';

describe('unicidad de club vivo', () => {
  it('el mail admin ignora clubes dados de baja', () => {
    expect(adminEmailInUseWhere('a@test.com')).toEqual({
      rol: 'admin',
      eliminado: false,
      club: { eliminado: false },
      usuario: { email: 'a@test.com' },
    });
  });

  it('el nombre se compara sin mayúsculas y excluye el propio id', () => {
    expect(clubNombreInUseWhere('  Prueba  ', 9)).toEqual({
      eliminado: false,
      nombre: { equals: 'Prueba', mode: 'insensitive' },
      id: { not: 9 },
    });
  });
});
