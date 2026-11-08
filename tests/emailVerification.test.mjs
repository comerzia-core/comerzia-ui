import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError } from 'axios';
import { securityChallengeMessage, securityChallengeErrorCode } from '../src/features/security/utils/securityChallengeMessages.ts';

function failure(code, status = 400) {
  return new AxiosError('Untrusted diagnostic', undefined, undefined, undefined, {
    status, data: { code, message: 'Private database or provider diagnostic' }, headers: {}, statusText: '', config: {},
  });
}
test('security messages use stable codes and never display provider diagnostics', () => {
  const error=failure('current_password_incorrect');
  assert.equal(securityChallengeErrorCode(error),'current_password_incorrect');
  assert.equal(securityChallengeMessage(error),'La contraseña actual no es correcta.');
  assert.ok(!securityChallengeMessage(failure('unrecognized')).includes('Private'));
});
test('session mismatch is determined by code rather than English text', () => {
  assert.equal(securityChallengeMessage(failure('email_change_session_mismatch')), 'Cierra la otra sesión antes de confirmar este cambio.');
});
test('network failure is not confused with accepted or delivered email', () => {
  assert.equal(securityChallengeMessage(new AxiosError('offline')), 'Sin conexión. Intenta nuevamente.');
  assert.equal(securityChallengeMessage(failure('unknown',429)), 'Espera un momento antes de reintentar.');
  assert.equal(securityChallengeMessage(failure('unknown',503)), 'Servicio temporalmente no disponible.');
});
