import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveOidcMessage, OIDC_ERROR_MESSAGES } from '../src/features/auth/utils/oidcMessages.ts';

test('resolveOidcMessage returns clear Spanish message for known error codes', () => {
  assert.equal(
    resolveOidcMessage('account_link_required'),
    'Ya existe una cuenta con este correo electrónico. Inicia sesión con tu contraseña habitual y vincula tu cuenta de Google desde Perfil > Seguridad.'
  );
  assert.equal(
    resolveOidcMessage('last_sign_in_method'),
    'No puedes desvincular tu cuenta de Google porque es tu único método de acceso. Configura una contraseña primero.'
  );
  assert.equal(
    resolveOidcMessage('external_identity_conflict'),
    'Esta cuenta de Google ya está vinculada a otro usuario.'
  );
  assert.equal(
    resolveOidcMessage('oidc_cancelled'),
    'Has cancelado la autenticación con Google.'
  );
  assert.equal(
    resolveOidcMessage('oidc_unavailable'),
    'El acceso con Google no está disponible en este momento.'
  );
});

test('resolveOidcMessage uses safe default fallback for unknown error codes', () => {
  const safeFallback = 'Ocurrió un problema con la autenticación de Google.';
  assert.equal(resolveOidcMessage('unknown_provider_code_123'), safeFallback);
  assert.equal(resolveOidcMessage(null), safeFallback);
  assert.equal(resolveOidcMessage(undefined), safeFallback);
  assert.equal(resolveOidcMessage(''), safeFallback);
});

test('resolveOidcMessage supports custom fallback message', () => {
  const custom = 'Mensaje personalizado seguro';
  assert.equal(resolveOidcMessage('unrecognized_code', custom), custom);
  assert.equal(resolveOidcMessage(null, custom), custom);
});

test('OIDC_ERROR_MESSAGES dictionary contains all expected error codes and never leaks internal diagnostics', () => {
  const expectedCodes = [
    'oidc_cancelled',
    'oidc_validation_failed',
    'oidc_transaction_invalid',
    'oidc_unavailable',
    'account_link_required',
    'registration_token_invalid',
    'registration_already_completed',
    'external_identity_conflict',
    'last_sign_in_method',
    'authentication_rate_limited',
    'invalid_client_address',
    'registration_busy'
  ];

  for (const code of expectedCodes) {
    assert.ok(OIDC_ERROR_MESSAGES[code], `Code ${code} must have a message`);
    assert.ok(!OIDC_ERROR_MESSAGES[code].toLowerCase().includes('trace'), `Code ${code} must not leak stack trace`);
    assert.ok(!OIDC_ERROR_MESSAGES[code].toLowerCase().includes('sql'), `Code ${code} must not leak SQL`);
    assert.ok(!OIDC_ERROR_MESSAGES[code].toLowerCase().includes('exception'), `Code ${code} must not leak Exception`);
  }
});

