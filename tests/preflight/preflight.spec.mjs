import { test, expect } from '@playwright/test';

const response = {
  status: 'NOT_READY', evaluatedAt: '2026-11-06T14:00:00Z',
  keyring: { configured: true, activeKeyId: 'fixture-key-id', keyLengthBits: 256, roundTripCryptoOk: true, previousKeysCount: 0 },
  database: { connectionOk: true, mfaFactorsTableExists: true, recoveryCodesTableExists: true, stepUpGrantsTableExists: true, emergencyRequestsTableExists: true },
  redis: { available: true, rateLimitingFunctional: true },
  clock: { utcNow: '2026-11-06T14:00:00Z', timezone: 'UTC', utcSynchronized: false },
  platformInventory: { totalPlatformAccounts: 3, enrolledAccounts: 2, unenrolledAccounts: 1, independentOperatorsCount: 1, unenrolledUsernames: ['pending-fixture'] },
  emergencyReadiness: { breakGlassToolAvailable: true, dualControlActive: true },
  blockers: [], warnings: [],
};

async function arrange(page, preflight, policyStatus = 200) {
  await page.route('**/saas/security/mfa/policy', route => route.fulfill({ status: policyStatus, json: { platformMandatory: false, updatedAt: null, updatedByUsername: null } }));
  await page.route('**/saas/security/mfa/preflight', route => route.fulfill({ status: preflight === null ? 503 : 200, json: preflight ?? { message: 'Unavailable' } }));
  await page.goto('/tests/preflight/index.html');
}

test('real panel translates, deduplicates and explains blockers without allowing activation', async ({ page }) => {
  let mutations = 0;
  await page.route('**/saas/security/mfa/policy/activate', route => { mutations++; return route.fulfill({ status: 500 }); });
  await arrange(page, { ...response,
    blockers: ['two_authorized_mfa_recovery_operators_required', 'ntp_reference_offset_not_verified', 'two_authorized_mfa_recovery_operators_required', 'future_server_diagnostic'],
    warnings: ['two_authorized_mfa_recovery_operators_required', 'host_ntp_discipline_requires_infrastructure_verification', 'host_ntp_discipline_requires_infrastructure_verification'],
  });
  await expect(page.getByText('Bloqueos Técnicos (3):')).toBeVisible();
  await expect(page.getByText('Advertencias Operativas (1):')).toBeVisible();
  await expect(page.getByText('Se requieren dos operadores autorizados con 2FA activo.')).toHaveCount(1);
  await expect(page.getByText('Autoriza dos personas distintas', { exact: false })).toBeVisible();
  await expect(page.getByText('two_authorized_mfa_recovery_operators_required')).toHaveCount(0);
  await expect(page.getByText('future_server_diagnostic')).toHaveCount(0);
  await expect(page.getByText('Sin verificar', { exact: true })).toBeVisible();
  await expect(page.getByText('Sincronización RFC 6238: Conforme', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Activar Obligatoriedad', exact: true })).toBeDisabled();
  expect(mutations).toBe(0);
});

test('server NOT_READY remains authoritative even when diagnostic lists are empty', async ({ page }) => {
  await arrange(page, response);
  await expect(page.getByText('Estado Preflight: BLOQUEOS IDENTIFICADOS')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activar Obligatoriedad', exact: true })).toBeDisabled();
});

test('failed preflight explains the unavailable state and keeps activation disabled', async ({ page }) => {
  await arrange(page, null);
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo consultar el diagnóstico' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activar Obligatoriedad', exact: true })).toBeDisabled();
});

test('READY cannot enable activation when policy status could not be retrieved', async ({ page }) => {
  await arrange(page, { ...response, status: 'READY' }, 503);
  await expect(page.getByText('SIN VERIFICAR', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activar Obligatoriedad', exact: true })).toBeDisabled();
});

test('failed refresh invalidates an older READY result', async ({ page }) => {
  await arrange(page, { ...response, status: 'READY' });
  await expect(page.getByRole('button', { name: 'Activar Obligatoriedad', exact: true })).toBeEnabled();
  await page.route('**/saas/security/mfa/preflight', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }));
  await page.getByRole('button', { name: 'Diagnóstico', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo consultar el diagnóstico' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activar Obligatoriedad', exact: true })).toBeDisabled();
});
