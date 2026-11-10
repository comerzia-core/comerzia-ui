import { test, expect } from '@playwright/test';

async function setup(page, readOnly = false) {
  const state = { writes: [], conflict: false, rows: [
    { id: 'UsedOpaque', name: 'Retail', description: 'Historical', equivalenceFactor: 1, inUse: true },
    { id: 'UnusedOpaque', name: 'Box', description: null, equivalenceFactor: 12, inUse: false },
  ] };
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/tenant/company/profile')) return route.fulfill({ json: {
      legalName: 'Fixture', commercialName: 'Fixture', slug: 'fixture', taxId: 'fixture', companyLogoUrl: null,
      timezone: 'America/La_Paz', currencyCode: 'BOB', currentSubscription: null,
    } });
    if (path.endsWith('/tenant/price-types/settings')) return route.fulfill({ json: {
      content: state.rows, totalElements: state.rows.length, totalPages: 1, number: 0, size: 10,
    } });
    if (path.includes('/tenant/price-types') && ['POST', 'PUT', 'DELETE'].includes(request.method())) {
      const body = request.method() === 'DELETE' ? null : request.postDataJSON();
      state.writes.push({ method: request.method(), body, path });
      if (state.conflict) return route.fulfill({ status: 409, json: { code: 'price_type_in_use' } });
      if (request.method() === 'DELETE') {
        state.rows = state.rows.filter(row => row.id !== path.split('/').at(-1));
        return route.fulfill({ status: 204 });
      }
      if (request.method() === 'POST') state.rows.push({ id: 'NewOpaque', ...body, inUse: false });
      else state.rows = state.rows.map(row => row.id === path.split('/').at(-1) ? { ...row, ...body } : row);
      return route.fulfill({ status: request.method() === 'POST' ? 201 : 200, json: { id: 'NewOpaque', ...body, inUse: false } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto('/tests/price-types/index.html' + (readOnly ? '?readonly' : ''));
  await page.getByRole('tab', { name: 'Configuración de precios' }).click();
  await expect(page.getByText('Retail', { exact: true }).filter({ visible: true })).toBeVisible();
  return state;
}

async function openActions(page, name) {
  if (test.info().project.name === 'mobile') {
    await page.getByRole('button', { name: `Opciones de ${name}`, exact: true }).tap();
  } else {
    const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });
    await row.click();
    await expect(page.getByRole('button', { name: 'Editar', exact: true })).toHaveCount(0);
    await row.click({ button: 'right' });
  }
  await expect(page.getByRole('button', { name: 'Editar', exact: true })).toBeVisible();
}

test('company tab warns about balance effects and protects used equivalence', async ({ page }) => {
  const state = await setup(page);
  await expect(page.getByRole('note')).toContainText('montos y balances');
  await openActions(page, 'Retail');
  await expect(page.getByRole('button', { name: 'Eliminar', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Unidades por presentación', { exact: true })).toHaveAttribute('readonly', '');
  await page.getByLabel('Nombre', { exact: true }).fill('Retail renamed');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0]).toMatchObject({ method: 'PUT', body: { name: 'Retail renamed', equivalenceFactor: 1 } });
  expect(Object.keys(state.writes[0].body).sort()).toEqual(['description', 'equivalenceFactor', 'name']);
  await expect(page.getByText('Retail renamed', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('create and delete use the real settings components and opaque references', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'Nuevo tipo de precio', exact: true }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Pack');
  await page.getByLabel('Unidades por presentación', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Pack', { exact: true }).filter({ visible: true })).toBeVisible();
  expect(state.writes[0].body).toEqual({ name: 'Pack', description: null, equivalenceFactor: 6 });
  await openActions(page, 'Pack');
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByText('Pack', { exact: true })).toHaveCount(0);
  expect(state.writes[1]).toEqual({ method: 'DELETE', body: null, path: '/api/tenant/price-types/NewOpaque' });
});

test('a server-side usage conflict keeps the editor open and explains the restriction', async ({ page }) => {
  const state = await setup(page);
  state.conflict = true;
  await openActions(page, 'Box');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Unidades por presentación', { exact: true }).fill('24');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Este tipo ya se utilizó');
  await expect(page.getByLabel('Unidades por presentación', { exact: true })).toBeVisible();
  expect(state.rows[1].equivalenceFactor).toBe(12);
});

test('read-only company configuration exposes no mutation controls', async ({ page }) => {
  const state = await setup(page, true);
  await expect(page.getByRole('button', { name: 'Nuevo tipo de precio', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Editar / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Eliminar / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Opciones de / })).toHaveCount(0);
  expect(state.writes).toEqual([]);
});
