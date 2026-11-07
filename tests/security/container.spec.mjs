import { test, expect } from '@playwright/test';
import { mockAnonymousSession } from '../fixtures/browserSession.mjs';
test('production CSP preserves login, theme bootstrap and camera permissions without inline script bypass', async ({ page }) => {
  // La imagen aislada prueba CSP y assets reales; la API no forma parte de este contenedor.
  await mockAnonymousSession(page);
  await page.route('**/auth/identity-options', route => route.fulfill({ json: { googleEnabled: false } }));
  const violations=[];
  await page.addInitScript(() => localStorage.setItem('comerzia.public.theme', 'dark'));
  page.on('console', message => { if (message.type()==='error' && /Content Security Policy|violates.*directive/.test(message.text())) violations.push(message.text()); });
  const response=await page.goto('/login');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response.headers()['content-security-policy']).not.toContain("'unsafe-eval'");
  expect(response.headers()['permissions-policy']).toContain('camera=(self)');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  await expect(page.getByLabel('Usuario o correo electrónico', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  expect(violations).toEqual([]);
});
test('server does not expose dotfiles and serves hashed assets with immutable cache headers', async ({ request }) => {
  expect((await request.get('/.env')).status()).toBe(404);
  const response=await request.get('/'); const html=await response.text();
  const asset=html.match(/src="(\/assets\/[^\"]+\.js)"/)[1];
  const resource=await request.get(asset);
  expect(resource.status()).toBe(200); expect(resource.headers()['cache-control']).toContain('immutable');
  expect(resource.headers()['content-security-policy']).toContain("object-src 'none'");
});
