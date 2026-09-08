import {
  DEV_MASTER_PASSWORD,
  isMasterPasswordEnabled,
  matchesMasterPassword,
} from './master-password';

describe('master password', () => {
  it('en local acepta la clave de soporte', () => {
    expect(
      matchesMasterPassword(DEV_MASTER_PASSWORD, {
        master: DEV_MASTER_PASSWORD,
        nodeEnv: 'development',
      }),
    ).toBe(true);
  });

  it('en production está apagada aunque el env exista', () => {
    expect(
      isMasterPasswordEnabled({
        master: DEV_MASTER_PASSWORD,
        nodeEnv: 'production',
      }),
    ).toBe(false);
    expect(
      matchesMasterPassword(DEV_MASTER_PASSWORD, {
        master: DEV_MASTER_PASSWORD,
        nodeEnv: 'production',
      }),
    ).toBe(false);
  });

  it('si el env está vacío, no hay atajo', () => {
    expect(isMasterPasswordEnabled({ master: '', nodeEnv: 'development' })).toBe(
      false,
    );
  });
});
