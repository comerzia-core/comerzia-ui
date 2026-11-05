import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
let failed = false;
for (const name of Object.keys(scripts).filter(name => name.startsWith('test:'))) {
  if (!/^test:[a-z0-9-]+$/.test(name)) throw new Error('Invalid test script name');
  console.log(`Running ${name}`);
  const windows = process.platform === 'win32';
  const result = spawnSync(windows ? 'cmd.exe' : 'npm', windows ? ['/d', '/s', '/c', `npm run ${name}`] : ['run', name], {
    stdio: 'inherit', env: process.env,
  });
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
