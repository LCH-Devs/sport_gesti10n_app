export const DEV_MASTER_PASSWORD = 'clubapp-master-dev';

export function isProductionEnv(nodeEnv?: string) {
  return (nodeEnv || '').toLowerCase() === 'production';
}

/** Pass maestra solo en no-producción y si el env tiene ≥ 8 caracteres. */
export function isMasterPasswordEnabled(opts: {
  master?: string;
  nodeEnv?: string;
}) {
  const master = opts.master || '';
  if (master.length < 8) return false;
  if (isProductionEnv(opts.nodeEnv)) return false;
  return true;
}

export function matchesMasterPassword(
  password: string,
  opts: { master?: string; nodeEnv?: string },
) {
  if (!isMasterPasswordEnabled(opts)) return false;
  return password === opts.master;
}
