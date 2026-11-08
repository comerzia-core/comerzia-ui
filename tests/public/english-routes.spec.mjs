import { test, expect } from '@playwright/test';
import { mockAnonymousSession } from '../fixtures/browserSession.mjs';

test.beforeEach(async ({ page }) => {
  await mockAnonymousSession(page);
  await page.route('**/auth/identity-options', route => route.fulfill({ json: { googleEnabled: false } }));
  await page.route('**/public/registration-options', route => route.fulfill({ json: { roles: [], branchCode: '001', cashRegisterCode: '001', cashRegisterName: 'Fixture' } }));
  await page.route('**/auth/oidc/google/complete', route => route.fulfill({ status: 400, json: { code: 'oidc_continuation_invalid' } }));
  await page.route('**/public/plans', route => route.fulfill({ json: [] }));
});

const aliases = [
  ['/registro', '/register'], ['/recuperar-contrasena', '/password-reset'],
  ['/verificar-email', '/verify-email'], ['/cambiar-email', '/change-email'],
  ['/auth/google/resultado', '/auth/google/result'],
  ['/invitacion', '/accept-invitation'], ['/aceptar-invitacion', '/accept-invitation'],
];
for (const [oldPath, canonical] of aliases) test(`legacy ${oldPath} resolves to English path`, async ({ page }) => {
  await page.goto(oldPath + '?source=legacy');
  await expect.poll(() => new URL(page.url()).pathname).toBe(canonical);
  await expect(page.locator('.public-site')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('source')).toBe('legacy');
  await page.reload();
  await expect.poll(() => new URL(page.url()).pathname).toBe(canonical);
});

for (const oldPath of ['/invitacion', '/aceptar-invitacion']) test(`legacy ${oldPath} preserves invitation material without accepting it`, async ({ page }) => {
  const token = 'route-fixture-token';
  const inspections = [], acceptances = [];
  await page.route('**/public/employee-invitations/inspect', route => {
    inspections.push(route.request().postDataJSON());
    return route.fulfill({ json: { publicReference: 'OpaqueInvitation', emailMasked: 'a***@example.test', companyName: 'Fixture Company', roleName: 'Seller', branchName: 'Store', expiresAt: '2099-01-01T00:00:00Z', valid: true, status: 'PENDING' } });
  });
  await page.route('**/public/employee-invitations/accept', route => { acceptances.push(route.request().postDataJSON()); return route.fulfill({ status: 409, json: {} }); });
  await page.goto(oldPath + '#token=' + token);
  await expect.poll(() => inspections.length).toBeGreaterThan(0);
  expect(inspections[0]).toEqual({ token });
  await expect.poll(() => new URL(page.url()).pathname).toBe('/accept-invitation');
  expect(page.url()).not.toContain(token);
  expect(acceptances).toHaveLength(0);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain(token);
});
