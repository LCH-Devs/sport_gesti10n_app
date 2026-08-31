import { PASSWORD_REGEX } from './dto-constraints';

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
