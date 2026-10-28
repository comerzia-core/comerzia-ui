import { mockAnonymousSession, authenticationFixture } from '../fixtures/browserSession.mjs';
import { test, expect } from '@playwright/test';

const plans = [
  { code: 701, name: 'Free', monthlyPrice: 0, maxBranches: 1, maxUsers: 1, maxProducts: 50, registrationAvailable: true },
  { code: 702, name: 'Inicial', monthlyPrice: 49, maxBranches: 1, maxUsers: 3, maxProducts: 500, registrationAvailable: false },
  { code: 703, name: 'Emprendedor', monthlyPrice: 99, maxBranches: 3, maxUsers: 10, maxProducts: 5000, registrationAvailable: false },
  { code: 704, name: 'Empresa', monthlyPrice: 199, maxBranches: 10, maxUsers: 50, maxProducts: 50000, registrationAvailable: false },
].map(plan => ({ ...plan, currency: 'BOB' }));
const options = { roles: ['DUEÑO', 'ADMINISTRADOR', 'CAJERO', 'VENDEDOR'], branchCode: '001', cashRegisterCode: '001', cashRegisterName: 'CAJA 01 - 001' };
const profile = { id: 'AccountOpaque', username: 'ana.perez', firstName: 'Ana', fullName: 'Ana Perez', email: 'ana@example.test', roles: ['OWNER', 'BRANCH_MANAGER', 'CASHIER', 'SELLER'], permissions: [], theme: 'cupcake', operational: true, companySettings: { commercialName: 'Mi negocio', timezone: 'America/La_Paz', currencyCode: 'BOB', planTypeCode: 701 } };
async function mocks(page) {
  await mockAnonymousSession(page);
  await page.route('**/public/plans', route => route.fulfill({ json: plans }));
  await page.route('**/public/registration-options', route => route.fulfill({ json: options }));
  await page.route('**/auth/profile', route => route.fulfill({ json: profile }));
  await page.route('**/tenant/billing/access', route => route.fulfill({ json: { planTypeCode: 701 } }));
  await page.route('**/security/menus/**', route => route.fulfill({ json: [] }));
  await page.route('**/tenant/realtime/stream', route => route.abort());
  await page.route('**/menus/**', route => route.fulfill({ json: [] }));
}
async function personal(page) {
  await page.getByLabel('Nombres', { exact: true }).fill('Ana');
  await page.getByLabel('Apellido materno', { exact: true }).fill('Perez');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('ana@example.test');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
}
async function access(page) {
  await page.getByLabel('Nombre de usuario', { exact: true }).fill('ana.perez');
  await page.getByLabel('Contraseña', { exact: true }).fill('StrongPassword123');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
}
test.beforeEach(async ({ page }) => { await mocks(page); });

test('landing has four actual plans, full Free row, no private bundle and no overflow', async ({ page }, info) => {
  const privateBundles = []; page.on('request', request => { if (request.url().includes('/src/routes/PrivateRouter')) privateBundles.push(request.url()); });
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Tu negocio, en tus manos.' })).toBeVisible();
  await expect(page.locator('.public-plan')).toHaveCount(4); await expect(page.getByText('Perpetuo')).toHaveCount(0);
  await expect(page.locator('.public-plan--free')).toContainText('50 productos');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(privateBundles).toEqual([]);
  await page.screenshot({ path: `test-results/public/${info.project.name}-landing.png`, fullPage: true });
});
test('public theme stays separate from the saved ERP theme and Google is a placeholder', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'cupcake'));
  await page.goto('/registro'); await expect(page.getByRole('button', { name: /Continuar con Google/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Usar modo oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('cupcake');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('registration requires one surname and email and preserves data when moving back', async ({ page }) => {
  await page.goto('/registro'); await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Escribe al menos un apellido.')).toBeVisible();
  await personal(page); await expect(page.getByRole('heading', { name: 'Un acceso solo tuyo.' })).toBeVisible();
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toHaveValue('ana@example.test');
  expect(await page.evaluate(() => localStorage.getItem('password'))).toBeNull();
});
test('registration shows fixed roles and caja, submits once with anonymous headers and loads the session', async ({ page }, info) => {
  let calls = 0; let payload;
  await page.route('**/public/registrations', async route => {
    calls++; payload = route.request().postDataJSON(); expect(route.request().headers().authorization).toBeUndefined();
    await route.fulfill({ status: 201, json: authenticationFixture('public-signup') });
  });
  await page.route('**/security/menu/my-tree', route => route.fulfill({ json: [] }));
  await page.goto('/registro'); await personal(page); await access(page);
  await expect(page.locator('.public-setup-register')).toContainText('CAJA 01 - 001');
  await expect(page.locator('.public-role-list>span')).toHaveCount(4); await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByLabel('Nombre de tu empresa', { exact: true }).fill('Mi negocio');
  await page.getByLabel('Nombre de tu primera tienda', { exact: true }).fill('TIENDA GRANDE');
  await expect(page.locator('.public-setup-register')).toContainText('CAJA 01 - TIE-GRA');
  await page.getByLabel('Nombre de tu primera tienda', { exact: true }).fill('Centro');
  await expect(page.locator('.public-setup-register')).toContainText('CAJA 01 - CEN');
  await page.screenshot({ path: `test-results/public/${info.project.name}-signup.png`, fullPage: true });
  await page.getByRole('button', { name: 'Crear mi empresa gratis', exact: true }).click();
  await expect.poll(() => calls).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cupcake');
  expect(payload.username).toBe('ana.perez'); expect(payload.branchName).toBe('Centro'); expect(payload.roles).toBeUndefined(); expect(payload.planTypeCode).toBeUndefined();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('StrongPassword123');
});
test('duplicate email returns to the correct field without losing company details', async ({ page }) => {
  await page.route('**/public/registrations', route => route.fulfill({ status: 409, json: { code: 'email_unavailable' } }));
  await page.goto('/registro'); await personal(page); await access(page);
  await page.getByLabel('Nombre de tu empresa', { exact: true }).fill('Mi negocio');
  await page.getByLabel('Nombre de tu primera tienda', { exact: true }).fill('Centro');
  await page.getByRole('button', { name: 'Crear mi empresa gratis', exact: true }).click();
  await expect(page.getByText('Este correo ya está registrado.')).toBeVisible();
  await page.getByLabel('Correo electrónico', { exact: true }).fill('otra@example.test');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByLabel('Nombre de tu empresa', { exact: true })).toHaveValue('Mi negocio');
});
test('login accepts email and preserves mandatory temporary password change', async ({ page }) => {
  let body;
  await page.route('**/auth/login', route => { body = route.request().postDataJSON(); return route.fulfill({ status: 428, json: { code: 'password_change_required' } }); });
  await page.goto('/login'); await page.getByLabel('Usuario o correo electrónico', { exact: true }).fill('ana@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('Temporary123');
  await page.getByRole('button', { name: 'Ir a mi empresa', exact: true }).click();
  await expect(page.getByLabel('Nueva contraseña', { exact: true })).toBeVisible(); expect(body.username).toBe('ana@example.test');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
test('missing video keeps its image and reduced motion disables video', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('.public-media img')).toBeVisible(); await expect(page.locator('video')).toHaveCount(0);
  expect(await page.locator('.public-media img').evaluate(element => element.complete && element.naturalWidth > 0)).toBeTruthy();
});
test('an existing session is never replaced by public signup', async ({ page }) => {
  await page.route('**/auth/refresh', route => route.fulfill({ json: authenticationFixture('existing-session') }));
  await page.goto('/registro');
  await expect(page.getByRole('heading', { name: 'Ya tienes una sesión abierta.' })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});
test('older installed apps open the operational entry rather than the landing', async ({ page }) => {
  await page.addInitScript(() => {
    const match = window.matchMedia.bind(window);
    window.matchMedia = query => { const result = match(query); if (query === '(display-mode: standalone)') Object.defineProperty(result, 'matches', { value: true }); return result; };
  });
  await page.goto('/'); await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Qué bueno verte.' })).toBeVisible();
});
test('mobile access does not download the hidden decorative video or poster', async ({ page, isMobile }) => {
  const decorative = [];
  page.on('request', request => { if (/merchants-(poster|loop)/.test(request.url())) decorative.push(request.url()); });
  await page.goto('/login'); await expect(page.getByLabel('Usuario o correo electrónico')).toBeVisible();
  if (isMobile) { expect(decorative).toEqual([]); await expect(page.locator('video')).toHaveCount(0); }
  else await expect(page.locator('.public-auth-story .public-media img')).toBeVisible();
});
