import { spawnSync } from 'node:child_process';
import { closeSync, mkdirSync, openSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve(process.env.COMERZIA_SECURITY_EVIDENCE_DIR || 'test-results/security-final');
mkdirSync(output, { recursive: true });
const units = readdirSync('tests').filter(name => name.endsWith('.test.mjs')).map(name => 'tests/' + name);
const tasks = [
  ['unit', process.execPath, ['--test', '--test-isolation=none', ...units]],
  ...[
    ['sessions', 'playwright.sessions.config.mjs'],
    ['email', 'playwright.email.config.mjs'],
    ['saas', 'playwright.saas.config.mjs'],
    ['public-identity', 'playwright.public.config.mjs', 'english-routes.spec.mjs', 'invitation-review.spec.mjs'],
    ['preflight', 'playwright.preflight.config.mjs'],
    ['recovery-ui', 'playwright.recovery.config.mjs'],
  ].map(([name, config, ...filters]) => [name, 'npx', ['playwright', 'test', '--config', config, ...filters]]),
];
const manifest = { startedAt: new Date().toISOString(), scope: 'Security regression stages 0-6; no stage7 login OTP/Magic Link; mocked browser APIs; no human recovery ceremony', tasks: [] };
for (const [name, command, args] of tasks) {
  const fd = openSync(resolve(output, name + '.log'), 'w');
  const windowsNpx = process.platform === 'win32' && command === 'npx';
  const result = spawnSync(windowsNpx ? 'cmd.exe' : command, windowsNpx ? ['/d', '/s', '/c', ['npx', ...args].join(' ')] : args, {
    stdio: ['ignore', fd, fd], env: { ...process.env, VITE_API_URL: '/api' },
  });
  closeSync(fd);
  manifest.tasks.push({ name, exit: result.status, error: result.error?.code || null });
  writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`${name}: exit=${result.status}`);
}
manifest.finishedAt = new Date().toISOString();
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
process.exitCode = manifest.tasks.every(task => task.exit === 0) ? 0 : 1;
