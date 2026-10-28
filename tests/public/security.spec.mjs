import { mockAnonymousSession, authenticationFixture } from '../fixtures/browserSession.mjs';
import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await mockAnonymousSession(page); });
for (const [status, message] of [
  [429, 'Demasiados intentos. Espera un momento.'],
  [503, 'Acceso temporalmente no disponible. Intenta en unos segundos.'],
]) {
  test(`login maps HTTP ${status} without pretending the account was administratively blocked`, async ({ page }) => {
    await page.route('**/auth/login', route => route.fulfill({ status, json: { code: status===429 ? 'authentication_rate_limited' : 'authentication_temporarily_unavailable', message: 'Internal technical details' } }));
    await page.goto('/login');
    await page.getByLabel('Usuario o correo electrónico', { exact: true }).fill('alice');
    await page.getByLabel('Contraseña', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Ir a mi empresa', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(message);
    await expect(page.getByText('Internal technical details')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ir a mi empresa', exact: true })).toBeEnabled();
  });
  test(`temporary password flow maps HTTP ${status} and accepts a passphrase`, async ({ page }) => {
    await page.route('**/auth/login', route => route.fulfill({ status:428, json:{code:'require_password_change'} }));
    let submitted;
    await page.route('**/auth/change-temporary-password', route => {
      submitted=route.request().postDataJSON();
      return route.fulfill({status,json:{code:status===429 ? 'authentication_rate_limited' : 'authentication_temporarily_unavailable'}});
    });
    await page.goto('/login');
    await page.getByLabel('Usuario o correo electrónico', { exact:true }).fill('alice');
    await page.getByLabel('Contraseña', { exact:true }).fill('password');
    await page.getByRole('button', {name:'Ir a mi empresa',exact:true}).click();
    await page.getByLabel('Nueva contraseña', {exact:true}).fill('a secure password phrase');
    await page.getByRole('button', {name:'Actualizar e ingresar',exact:true}).click();
    await expect(page.getByRole('alert')).toHaveText(message);
    expect(submitted.currentPassword).toBe('password');
    expect(submitted.newPassword).toBe('a secure password phrase');
  });
}
