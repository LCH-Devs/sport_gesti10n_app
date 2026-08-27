#!/usr/bin/env node
/**
 * Sincroniza el Postgres local (Docker) con las migraciones Prisma.
 *
 * Desde sport_gesti10n_app:
 *   pnpm db:sync     aplica pendientes (tablas/columnas nuevas, dropea las viejas)
 *   pnpm db:reset    borra datos, re-aplica todas las migraciones y corre el seed
 *
 * Esto cubre, entre otras:
 *   - Usuario + Membresia (reemplazan Admin y Socio)
 *   - eliminado en Membresia, GrupoFamiliar, Actividad, Espacio, Horario, Noticia
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const reset = process.argv.includes('--reset');
const win = process.platform === 'win32';
const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(apiDir, '../..');
const envApi = path.join(apiDir, '.env');
const envExample = path.join(root, '.env.example');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: opts.silent ? 'pipe' : 'inherit',
    cwd: opts.cwd,
    shell: win,
    env: process.env,
  });
  return r.status ?? 1;
}

function fail(msg) {
  console.error(`\n${msg}\n`);
  process.exit(1);
}

async function waitForPostgres() {
  for (let i = 0; i < 30; i++) {
    const code = run(
      'docker',
      ['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'clubapp', '-d', 'clubapp'],
      { cwd: root, silent: true },
    );
    if (code === 0) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  fail('Postgres no respondió. ¿Docker está corriendo? Probá: docker compose up db -d');
}

if (!fs.existsSync(envApi) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envApi);
  console.log('Creé apps/api/.env desde .env.example');
}

console.log('\n1. Docker Postgres…');
if (run('docker', ['compose', 'up', '-d', 'db'], { cwd: root }) !== 0) {
  fail('No pude levantar el servicio db. ¿Docker Desktop está abierto?');
}

await waitForPostgres();
console.log('   listo (clubapp_db)\n');

console.log(reset ? '2. Reset (borra datos) + migraciones + seed…' : '2. Aplicar migraciones pendientes…');
if (reset) {
  if (
    run('npx', ['prisma', 'migrate', 'reset', '--force'], { cwd: apiDir }) !== 0
  ) {
    fail('Falló prisma migrate reset.');
  }
} else if (run('npx', ['prisma', 'migrate', 'deploy'], { cwd: apiDir }) !== 0) {
  fail(
    'Falló prisma migrate deploy.\nSi la base quedó a medias, corré: pnpm db:reset\n(eso borra los datos locales y deja el schema al día).',
  );
}

console.log('\n3. Prisma Client…');
if (run('npx', ['prisma', 'generate'], { cwd: apiDir }) !== 0) {
  fail('Falló prisma generate. Si la API está en watch, parala y volvé a correr este script.');
}

console.log('\n4. Estado de migraciones:');
run('npx', ['prisma', 'migrate', 'status'], { cwd: apiDir });

console.log(`
Listo. Schema al día con el repo.

Cambios que aplica este flujo (si faltaban):
  + tablas Usuario, Membresia
  + columna eliminado (Membresia, GrupoFamiliar, Actividad, Espacio, Horario, Noticia)
  - tablas Admin, Socio (los datos se copian a Usuario/Membresia)

Reiniciá la API si estaba corriendo: pnpm api:dev
`);
