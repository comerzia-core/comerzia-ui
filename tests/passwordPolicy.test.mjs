import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordFeedback } from '../src/features/auth/utils/passwordPolicy.ts';
test('new credentials allow passphrases and Unicode within BCrypt byte limits', () => {
  for (const value of ['A safe long passphrase', 'á'.repeat(36), '🔐'.repeat(18)]) assert.equal(passwordFeedback(value), undefined);
  for (const value of ['short', 'x'.repeat(65), 'á'.repeat(37), 'x'.repeat(15) + '\u0000', 'x'.repeat(15) + '\ud800'])
    assert.equal(typeof passwordFeedback(value), 'string');
});
