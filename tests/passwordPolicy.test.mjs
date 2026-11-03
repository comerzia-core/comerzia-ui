import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordFeedback, passwordChecks } from '../src/features/auth/utils/passwordPolicy.ts';
test('new credentials enforce composition, Unicode and BCrypt byte limits', () => {
  for (const value of ['Aa1!bcde', 'A safe long passphrase 1!', 'Aa1!' + 'ñ'.repeat(34), 'Aa1!' + '🔐'.repeat(17)]) {
    assert.equal(passwordFeedback(value), undefined, value);
    assert.equal(passwordChecks(value).every(rule => rule.isValid), true);
  }
  for (const value of ['aaaaaaaa', 'short', 'short-secret', 'x'.repeat(65), 'Aa1!' + 'ñ'.repeat(35),
    'Aa1!' + '🔐'.repeat(18), 'Aa1!' + 'x'.repeat(15) + '\u0000', 'Aa1!' + 'x'.repeat(15) + '\ud800', 'PasswordPassword123!'])
    assert.equal(typeof passwordFeedback(value), 'string');
});
