import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/notifications/reconcile')) return route.fulfill({ status: 204 });
    if (path.endsWith('/profile') && request.method() === 'PUT') return route.fulfill({ status: 400,
      json: { code: 'email_change_requires_verification', message: 'Direct modification of login email is restricted.' } });
    if (path.endsWith('/profile')) return route.fulfill({ json: { id: 'review-owner', username: 'review-owner',
      firstName: 'Review', paternalSurname: 'Owner', fullName: 'Review Owner', email: 'owner@example.org',
      phoneNumber: '70000000', roles: [], companyName: 'Review', status: 'ACTIVE' } });
    if (path.endsWith('/email-verification/status')) return route.fulfill({ json: { email: 'owner@example.org',
      status: 'VERIFIED', canRequest: false, cooldownSecondsRemaining: 0, deliveryState: 'NOT_REQUESTED' } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/tests/email/index.html?mode=profile');
  await expect(page.locator('input[type=email]')).toHaveValue('owner@example.org');
});

test('profile keeps Spanish labels readable after the identity guard change', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Seguridad y Contraseña', exact: true })).toBeVisible();
  await expect(page.getByText('Correo Electrónico', { exact: true })).toBeVisible();
  await expect(page.getByText('Teléfono / Celular', { exact: true })).toBeVisible();
});

test('direct email change rejection remains visible and preserves the submitted form', async ({ page }) => {
  await page.locator('input[type=email]').fill('new@example.org');
  await page.locator('form button[type=submit]').click();
  await expect(page.getByText('El cambio de correo de acceso requiere verificación segura.', { exact: true })).toBeVisible();
  await expect(page.locator('input[type=email]')).toHaveValue('new@example.org');
});
