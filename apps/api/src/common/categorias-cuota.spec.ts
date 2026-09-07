import {
  CATEGORIA_PLENO_SLUG,
  isDefaultCategoriaLabel,
  matchCategoriaCuota,
  slugifyCategoriaNombre,
} from './categorias-cuota';

describe('categorias-cuota helpers', () => {
  it('slugifica nombres con tildes y mayúsculas', () => {
    expect(slugifyCategoriaNombre('Socio Deportivo')).toBe('socio-deportivo');
    expect(slugifyCategoriaNombre('Jubilado')).toBe('jubilado');
  });

  it('reconoce Socio pleno y aliases', () => {
    expect(isDefaultCategoriaLabel('')).toBe(true);
    expect(isDefaultCategoriaLabel('Socio pleno')).toBe(true);
    expect(isDefaultCategoriaLabel('pleno')).toBe(true);
    expect(isDefaultCategoriaLabel('deportivo')).toBe(false);
  });

  it('matchea por slug o nombre; vacío cae al default', () => {
    const cats = [
      { id: 1, nombre: 'Socio pleno', slug: CATEGORIA_PLENO_SLUG, es_default: true },
      { id: 2, nombre: 'Deportivo', slug: 'deportivo', es_default: false },
    ];
    expect(matchCategoriaCuota(cats, '')?.id).toBe(1);
    expect(matchCategoriaCuota(cats, 'socio pleno')?.id).toBe(1);
    expect(matchCategoriaCuota(cats, 'Deportivo')?.id).toBe(2);
    expect(matchCategoriaCuota(cats, 'vitalicio')).toBeNull();
  });
});
