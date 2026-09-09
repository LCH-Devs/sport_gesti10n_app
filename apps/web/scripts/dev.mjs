import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(webRoot, '../..');
const apiRoot = join(webRoot, '../api');

/** Carga KEY=VAL de un .env sin pisar lo que ya está en process.env. */
function loadEnvFile(file, allowKeys) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, 'utf8');
  const allow = allowKeys ? new Set(allowKeys) : null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    if (allow && !allow.has(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile(join(repoRoot, '.env'), ['WEB_DEV_TURBO', 'WEB_NO_OPEN', 'WEB_OPEN_URL']);
loadEnvFile(join(apiRoot, '.env'), ['WEB_DEV_TURBO', 'WEB_NO_OPEN', 'WEB_OPEN_URL']);
loadEnvFile(join(webRoot, '.env'));
loadEnvFile(join(webRoot, '.env.local'));

const port = Number(process.env.PORT || 3000);
const url = process.env.WEB_OPEN_URL || `http://localhost:${port}/landing`;

function flagOn(name) {
  const v = (process.env[name] || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

const turbo = flagOn('WEB_DEV_TURBO');
const nextArgs = ['exec', 'next', 'dev', '-p', String(port)];
if (turbo) {
  nextArgs.push('--turbopack');
  console.log('[web] WEB_DEV_TURBO=1 → Next con Turbopack');
}

const next = spawn('pnpm', nextArgs, {
  cwd: webRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

function portOpen() {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function waitThenOpenChrome() {
  if (process.env.WEB_NO_OPEN === '1') return;
  for (let i = 0; i < 80; i++) {
    if (await portOpen()) {
      const child = spawn(
        'cmd',
        ['/c', 'start', '', 'chrome', url],
        { detached: true, stdio: 'ignore', windowsHide: true },
      );
      child.unref();
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

waitThenOpenChrome();

next.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
