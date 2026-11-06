import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isValidTotpCode, isValidRecoveryCode } from '../src/features/security/utils/mfaInput.ts';
import { getMfaPreflightDiagnostics } from '../src/features/security/utils/mfaPreflightDiagnostics.ts';

test('preflight diagnostics show one actionable Spanish message per code, prioritizing blockers', () => {
  const code = 'two_authorized_mfa_recovery_operators_required';
  const result = getMfaPreflightDiagnostics([code, code], [code, 'ntp_reference_offset_not_verified', 'ntp_reference_offset_not_verified']);
  assert.equal(result.blockers.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.blockers[0].label, 'Se requieren dos operadores autorizados con 2FA activo.');
  assert.match(result.blockers[0].action, /dos personas distintas/);
  assert.equal(result.warnings[0].code, 'ntp_reference_offset_not_verified');
});

test('unknown preflight code is not displayed as an unexplained technical message', () => {
  const result = getMfaPreflightDiagnostics(['future_server_diagnostic'], []);
  assert.equal(result.blockers[0].label.includes('future_server_diagnostic'), false);
  assert.match(result.blockers[0].action, /responsable de seguridad/);
});

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
  assert.equal(isValidTotpCode('123 456'), false);
});

test('MFA recovery code format normalization and validation', () => {
  // Valid 10-char formats (with or without hyphen)
  assert.equal(isValidRecoveryCode('a1b2c-d3e4f'), true);
  assert.equal(isValidRecoveryCode('A1B2CD3E4F'), true);
  assert.equal(isValidRecoveryCode('  a1b2c-d3e4f  '), true);
  assert.equal(isValidRecoveryCode('2345678-abcdefg-jkmnpqr-stuvwxy'), true);

  // Invalid recovery codes
  assert.equal(isValidRecoveryCode(''), false);
  assert.equal(isValidRecoveryCode('short'), false);
  assert.equal(isValidRecoveryCode('a1b2c-d3e4f-extra'), false);
  assert.equal(isValidRecoveryCode('2345678-abcdefg-jkmnpqr-stuvwxy!'), false);
});


import { bindMfaOperation } from '../src/features/security/utils/mfaOperation.ts';
import { createHash } from 'node:crypto';
test('step-up binds canonical payload with a fixed independently specified digest', async () => {
  const actual = await bindMfaOperation('MANAGE_SAAS_TEAM', 'PATCH:/saas/team/target', { roleCodes: [3, 2], disabled: false });
  const expected = createHash('sha256').update('{"disabled":false,"roleCodes":[3,2]}\n{}').digest('hex');
  assert.equal(actual, 'PATCH:/saas/team/target#' + expected);
});
test('changing target, roles or disabled status changes the step-up intent', async () => {
  const values = await Promise.all([
    bindMfaOperation('MANAGE_SAAS_TEAM','PATCH:/saas/team/a',{ roleCodes: [1], disabled: false }),
    bindMfaOperation('MANAGE_SAAS_TEAM','PATCH:/saas/team/b',{ roleCodes: [1], disabled: false }),
    bindMfaOperation('MANAGE_SAAS_TEAM','PATCH:/saas/team/a',{ roleCodes: [2], disabled: false }),
    bindMfaOperation('MANAGE_SAAS_TEAM','PATCH:/saas/team/a',{ roleCodes: [1], disabled: true }),
  ]);
  assert.equal(new Set(values).size, 4);
});
test('query reference is bound without copying the raw query into the authority context', async () => {
  const one = await bindMfaOperation('ADMIN_MFA_RECOVERY','POST:/tenant/users/a/mfa-recovery/approve?reference=first');
  const two = await bindMfaOperation('ADMIN_MFA_RECOVERY','POST:/tenant/users/a/mfa-recovery/approve?reference=second');
  assert.notEqual(one, two); assert.equal(one.includes('reference'), false);
});
test('duplicate query parameter order cannot substitute the first selected reference', async () => {
  const one = await bindMfaOperation('ADMIN_MFA_RECOVERY','POST:/tenant/users/a/mfa-recovery/approve?reference=one&reference=two');
  const two = await bindMfaOperation('ADMIN_MFA_RECOVERY','POST:/tenant/users/a/mfa-recovery/approve?reference=two&reference=one');
  assert.notEqual(one,two);
});
test('multipart intent binds QR bytes, name and content type as well as settings', async () => {
  const one = new FormData();one.append('settings',new Blob(['{"bankName":"Test bank"}'],{type:'application/json'}));one.append('qr',new File(['first'],'qr.png',{type:'image/png'}));
  const two = new FormData();two.append('settings',new Blob(['{"bankName":"Test bank"}'],{type:'application/json'}));two.append('qr',new File(['second'],'qr.png',{type:'image/png'}));
  assert.notEqual(await bindMfaOperation('UPDATE_SECURITY_SETTINGS','PUT:/saas/billing/settings',one),await bindMfaOperation('UPDATE_SECURITY_SETTINGS','PUT:/saas/billing/settings',two));
});
test('JSON object property order is canonical, array order remains significant', async () => {
  const one = await bindMfaOperation('MANAGE_SAAS_TEAM',undefined,{z: [1, 2], a: '?'});
  assert.equal(one, await bindMfaOperation('MANAGE_SAAS_TEAM',undefined,{a: '?', z: [1, 2]}));
  assert.notEqual(one, await bindMfaOperation('MANAGE_SAAS_TEAM',undefined,{a: '?', z: [2, 1]}));
});

test('number notation and numeric-looking keys match the backend canonical protocol', async () => {
  const body = { values: [1e-7, 0.000001, 1.23e22, -0.01, 12.5, -0], '2': 'two', '10': 'ten' };
  const expected = '{"10":"ten","2":"two","values":[1e-7,0.000001,1.23e+22,-0.01,12.5,0]}\n{}';
  assert.equal(await bindMfaOperation('MANAGE_SAAS_TEAM','PATCH:/saas/team/target',body),
    'PATCH:/saas/team/target#' + createHash('sha256').update(expected).digest('hex'));
});
