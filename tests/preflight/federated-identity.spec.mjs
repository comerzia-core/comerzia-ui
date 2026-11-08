import { test, expect } from '@playwright/test';
const identity = { publicReference: 'OpaqueIdentity', provider: 'GOOGLE', emailAtLink: 'fixture@example.test', linkedAt: '2026-11-06T12:00:00Z' };
test.beforeEach(async ({ page }) => {
  await page.route('**/auth/csrf', route => route.fulfill({ json: { token: 'csrf-fixture' } }));
  await page.route('**/profile/external-identities', route => route.fulfill({ json: [identity] }));
});
test('Google-only profile can start confirmation and keeps its last sign-in method protected', async ({ page }) => {
  let calls = 0;
  await page.route('**/profile/reauthentication/google/start', route => {
    calls++;
    expect(route.request().headers()['x-csrf-token']).toBe('csrf-fixture');
    return route.fulfill({ json: { authorizationUrl: '/tests/preflight/index.html?panel=identities&returned=reauth', state: 'fixture-state' } });
  });
  await page.goto('/tests/preflight/index.html?panel=identities');
  await expect(page.getByRole('button', { name: 'Desvincular', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Confirmar identidad con Google', exact: true }).click();
  await expect(page).toHaveURL(/returned=reauth/);
  expect(calls).toBe(1);
});
test('failed identity lookup offers retry without presenting missing identities as a valid result', async ({ page }) => {
  await page.route('**/profile/external-identities', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/tests/preflight/index.html?panel=identities');
  await expect(page.getByRole('alert')).toContainText('No se pudieron consultar tus métodos de acceso.');
  await expect(page.getByRole('button', { name: 'Confirmar identidad con Google', exact: true })).toHaveCount(0);
  await page.route('**/profile/external-identities', route => route.fulfill({ json: [identity] }));
  await page.getByRole('button', { name: 'Reintentar consulta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar identidad con Google', exact: true })).toBeVisible();
});
