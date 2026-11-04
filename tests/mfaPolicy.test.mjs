import assert from 'node:assert/strict';
import { test } from 'node:test';

// Validation logic for TOTP format and Recovery Code format
function isValidTotpCode(code) {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim();
  return /^\d{6}$/.test(trimmed);
}

function normalizeRecoveryCode(code) {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isValidRecoveryCode(code) {
  const norm = normalizeRecoveryCode(code);
  return norm.length === 10;
}

function resolveMfaState(authResponse) {
  if (authResponse?.mfaRequired) {
    if (authResponse?.mfaType === 'ENROLLMENT_REQUIRED' || authResponse?.authenticationState === 'MFA_ENROLLMENT_REQUIRED') {
      return 'MFA_ENROLLMENT_REQUIRED';
    }
    return 'MFA_PENDING';
  }
  return authResponse?.token ? 'FULL' : 'ANONYMOUS';
}

test('TOTP 6-digit code format validation', () => {
  // Valid codes (including with leading zeros)
  assert.equal(isValidTotpCode('123456'), true);
  assert.equal(isValidTotpCode('000123'), true);
  assert.equal(isValidTotpCode(' 098765 '), true);

  // Invalid codes
  assert.equal(isValidTotpCode(''), false);
  assert.equal(isValidTotpCode('12345'), false); // 5 digits
  assert.equal(isValidTotpCode('1234567'), false); // 7 digits
  assert.equal(isValidTotpCode('12345a'), false); // non-digit
  assert.equal(isValidTotpCode('abcdef'), false);
  assert.equal(isValidTotpCode(null), false);
});

test('MFA recovery code format normalization and validation', () => {
  // Valid 10-char formats (with or without hyphen)
  assert.equal(isValidRecoveryCode('a1b2c-d3e4f'), true);
  assert.equal(isValidRecoveryCode('A1B2CD3E4F'), true);
  assert.equal(isValidRecoveryCode('  a1b2c-d3e4f  '), true);
  assert.equal(normalizeRecoveryCode('a1b2c-d3e4f'), 'a1b2cd3e4f');

  // Invalid recovery codes
  assert.equal(isValidRecoveryCode(''), false);
  assert.equal(isValidRecoveryCode('short'), false);
  assert.equal(isValidRecoveryCode('a1b2c-d3e4f-extra'), false);
  assert.equal(isValidRecoveryCode(null), false);
});

test('Session MFA state resolution according to server contract', () => {
  assert.equal(resolveMfaState({ mfaRequired: true, mfaType: 'TOTP_CHALLENGE' }), 'MFA_PENDING');
  assert.equal(resolveMfaState({ mfaRequired: true, mfaType: 'ENROLLMENT_REQUIRED' }), 'MFA_ENROLLMENT_REQUIRED');
  assert.equal(resolveMfaState({ mfaRequired: true, authenticationState: 'MFA_ENROLLMENT_REQUIRED' }), 'MFA_ENROLLMENT_REQUIRED');
  assert.equal(resolveMfaState({ mfaRequired: false, token: 'jwt-token-xyz' }), 'FULL');
  assert.equal(resolveMfaState(null), 'ANONYMOUS');
});

