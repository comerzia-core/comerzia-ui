import { readdir, readFile } from 'node:fs/promises';
const assets = new URL('../dist/assets/', import.meta.url);
const files = (await readdir(assets)).filter(file => file.endsWith('.css'));
if (!files.length) throw new Error('No compiled stylesheets found.');
for (const file of files) {
  const css = await readFile(new URL(file, assets), 'utf8');
  if (css.includes('[object Object]')) throw new Error(`Invalid serialized style object in ${file}`);
}
console.log(`Compiled CSS integrity passed (${files.length} stylesheets).`);
