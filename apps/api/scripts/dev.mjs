/**
 * Arranque local: migrate + generate + nest.
 * En Windows `prisma generate` falla con EPERM si otro node tiene
 * lockeado query_engine-windows.dll.node (otro api:dev, test, etc.).
 * En ese caso seguimos: el client ya está generado.
 */
import { spawnSync } from 'node:child_process';

const win = process.platform === 'win32';

function run(cmd, args, { allowFail = false } = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: win });
  const code = r.status ?? 1;
  if (code !== 0 && !allowFail) process.exit(code);
  return code;
}

if (run('npx', ['prisma', 'migrate', 'deploy']) !== 0) process.exit(1);

if (run('npx', ['prisma', 'generate'], { allowFail: true }) !== 0) {
  console.warn(
    '\nprisma generate omitido: el query engine está en uso (cerrá el otro api:dev).\nSigo con Nest; si cambiaste el schema, paramí todos los node y volvé a generar.\n',
  );
}

process.exit(run('npx', ['nest', 'start', '--watch']));
