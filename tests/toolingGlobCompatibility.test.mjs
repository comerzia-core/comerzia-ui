import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';

const require = createRequire(import.meta.url);
for (const consumer of ['eslint', '@typescript-eslint/typescript-estree']) {
  test(`${consumer} resolves a compatible patched glob matcher`, () => {
    const consumerRequire = createRequire(require.resolve(consumer));
    const { minimatch } = consumerRequire('minimatch');
    assert.equal(minimatch('src/features/auth/Login.tsx', 'src/features/auth/**/*.tsx', { dot: true }), true);
    assert.equal(minimatch('src/features/pos/Login.tsx', 'src/features/auth/**', { dot: true }), false);
    assert.equal(minimatch('src/.hidden.ts', 'src/**/*.ts', { dot: true }), true);
    assert.equal(minimatch('C:/workspace/src/login.ts', '**/*.ts', { dot: true }), true);
  });
}
