import { test, expect } from '@playwright/test';
import { authenticationFixture } from '../fixtures/browserSession.mjs';

async function mockIdentity(page, { mode = 'PRIVATE', role = 'OWNER', session = 'authenticated', configDelay = 0 } = {}) {
  const state = { session, confirmations: [], inspections: [] };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/public/platform/config')) {
      if (configDelay) await new Promise(resolve => setTimeout(resolve, configDelay));
      return route.fulfill({ json: { platformMode: mode, brandName: 'Fixture Company',
        publicLandingEnabled: mode === 'PUBLIC', publicRegistrationEnabled: false, publicCatalogsEnabled: false } });
    }
    if (path.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'csrf-fixture' } });
    if (path.endsWith('/auth/refresh')) {
      if (state.session === 'anonymous') return route.fulfill({ status: 401, json: { code: 'session_expired' } });
      if (state.session === 'pending') return route.fulfill({ status: 403, json: { code: 'session_authentication_incomplete' } });
      if (state.session === 'unavailable') return route.fulfill({ status: 503, json: { code: 'authentication_temporarily_unavailable' } });
      return route.fulfill({ json: authenticationFixture() });
    }
    if (path.endsWith('/auth/profile')) return route.fulfill({ json: {
      id: 'AccountOpaque', username: 'fixture', fullName: 'Fixture User', roles: [role], permissions: [],
      operational: true, companySettings: role === 'ROOT' ? null : {
        commercialName: 'Fixture Company', timezone: 'America/La_Paz', currencyCode: 'BOB', planTypeCode: 701,
      },
    } });
    if (path.includes('/menus/')) return route.fulfill({ json: [] });
    if (path.endsWith('/public/email-change/inspect')) {
      state.inspections.push(route.request().postDataJSON());
      return route.fulfill({ json: { valid: true, status: 'PENDING', maskedEmail: 'n***@example.test' } });
    }
    if (path.endsWith('/profile/email-change/confirm')) {
      state.confirmations.push(route.request().postDataJSON());
      state.session = 'anonymous';
      return route.fulfill({ json: { success: true } });
    }
    if (path.endsWith('/auth/identity-options')) return route.fulfill({ json: { googleEnabled: false } });
    if (path.endsWith('/auth/logout')) return route.fulfill({ status: 204 });
    if (path.includes('/realtime/')) return route.abort();
    return route.fulfill({ json: {} });
  });
  return state;
}

for (const mode of ['PRIVATE', 'PUBLIC']) {
  for (const role of ['OWNER', 'ROOT']) {
    test(`${mode} login restores ${role} session and redirects after direct navigation and reload`, async ({ page }) => {
      await mockIdentity(page, { mode, role });
      const home = role === 'ROOT' ? '/saas/dashboard' : '/dashboard';
      await page.goto('/login');
      await expect.poll(() => new URL(page.url()).pathname).toBe(home);
      await expect(page.getByLabel('Contraseña', { exact: true })).toHaveCount(0);
      await page.goto('/login');
      await expect.poll(() => new URL(page.url()).pathname).toBe(home);
      await page.reload();
      await expect.poll(() => new URL(page.url()).pathname).toBe(home);
    });
  }
}

test('private anonymous login remains available', async ({ page }) => {
  await mockIdentity(page, { session: 'anonymous' });
  await page.goto('/login');
  await expect(page.getByLabel('Usuario o correo', { exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/login');
});

test('pending MFA stays at verification instead of opening the dashboard', async ({ page }) => {
  await mockIdentity(page, { session: 'pending' });
  await page.goto('/login');
  await expect(page.getByText('Verificación de dos pasos', { exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/login');
});

test('session outage provides a retry without offering credentials prematurely', async ({ page }) => {
  const state = await mockIdentity(page, { session: 'unavailable' });
  await page.goto('/login');
  await expect(page.getByRole('alert')).toContainText('No se pudo conectar');
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveCount(0);
  state.session = 'authenticated';
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/dashboard');
});

for (const mode of ['PRIVATE', 'PUBLIC']) {
  test(`${mode} email change retains its token during configuration loading and confirms only on request`, async ({ page }) => {
    const state = await mockIdentity(page, { mode, session: 'anonymous', configDelay: 300 });
    await page.goto('/change-email#token=fixture-change-token');
    await expect(page.getByRole('heading', { name: 'Confirmar nuevo correo', exact: true })).toBeVisible();
    await expect(page.locator('.public-site')).toHaveCount(mode === 'PRIVATE' ? 0 : 1);
    if (mode === 'PRIVATE') await expect(page.getByText('Seguridad de tu cuenta corporativa')).toBeVisible();
    expect(state.inspections).toEqual([{ token: 'fixture-change-token' }]);
    expect(state.confirmations).toEqual([]);
    expect(page.url()).not.toContain('fixture-change-token');
    await page.getByRole('button', { name: 'Confirmar mi nuevo correo electrónico', exact: true }).click();
    await expect(page.getByRole('heading', { name: '¡Correo Actualizado!' })).toBeVisible();
    expect(state.confirmations).toEqual([{ token: 'fixture-change-token' }]);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('fixture-change-token');
  });
}
