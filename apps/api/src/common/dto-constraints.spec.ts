import { PASSWORD_REGEX, TELEFONO_REGEX } from './dto-constraints';

describe('dto-constraints password', () => {
  it('acepta una clave que cumple la política', () => {
    expect(PASSWORD_REGEX.test('ClubApp1!')).toBe(true);
  });

  it('rechaza sin mayúscula, número o especial', () => {
    expect(PASSWORD_REGEX.test('socio123')).toBe(false);
    expect(PASSWORD_REGEX.test('Socioooo')).toBe(false);
    expect(PASSWORD_REGEX.test('Socio123')).toBe(false);
    expect(PASSWORD_REGEX.test('Ab1!')).toBe(false);
  });
});

describe('dto-constraints telefono', () => {
  it('acepta un teléfono argentino típico', () => {
    expect(TELEFONO_REGEX.test('1144556677')).toBe(true);
    expect(TELEFONO_REGEX.test('+54 11 4455-6677')).toBe(true);
  });

  it('rechaza teléfono demasiado corto', () => {
    expect(TELEFONO_REGEX.test('123')).toBe(false);
  });
});
