import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);
const url = process.env.WEB_OPEN_URL || `http://localhost:${port}/landing`;

const next = spawn('pnpm', ['exec', 'next', 'dev', '-p', String(port)], {
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
