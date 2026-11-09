import { test, expect } from '@playwright/test';

async function setup(page, readOnly = false) {
  const state = { writes: [], rows: [{ id: 'used', name: 'Color' }, { id: 'free', name: 'Material' }] };
  await page.route('**/api/tenant/variant-types**', async route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: state.rows });
    state.writes.push({ method: request.method(), data: request.postDataJSON() });
    const id = new URL(request.url()).pathname.split('/').at(-1);
    if (request.method() === 'DELETE') {
      if (id === 'used') return route.fulfill({ status: 409, json: { code: 'variant_type_in_use' } });
      state.rows = state.rows.filter(row => row.id !== id);
      return route.fulfill({ status: 204 });
    }
    const name = request.postDataJSON().name;
    if (request.method() === 'POST') state.rows.push({ id: 'new', name });
    else state.rows = state.rows.map(row => row.id === id ? { ...row, name } : row);
    return route.fulfill({ json: { id: request.method() === 'POST' ? 'new' : id, name } });
  });
  await page.goto('/tests/variant-types/index.html' + (readOnly ? '?readonly' : ''));
  await expect(page.locator('input').first()).toHaveValue('Color');
  return state;
}

test('create and rename inline without a status switch', async ({ page }) => {
  const state = await setup(page);
  const input = page.locator('input').first();
  await input.click();
  await input.fill('Textura');
  await page.getByText(/Crear.*TEXTURA/).click();
  await expect(page.locator('output')).toHaveText('new');
  await input.click();
  await page.getByTitle('Editar tipo de variante').last().click({ force: true });
  const edit = page.locator('input').last();
  await expect(page.getByRole('switch')).toHaveCount(0);
  await edit.fill('Acabado');
  await edit.press('Enter');
  await expect.poll(() => state.writes.length).toBe(2);
  expect(state.writes.map(write => write.data)).toEqual([{ name: 'TEXTURA' }, { name: 'ACABADO' }]);
});

test('referenced deletion displays a warning and preserves selection', async ({ page }) => {
  const state = await setup(page);
  await page.locator('input').first().click();
  await page.getByTitle('Editar tipo de variante').first().click({ force: true });
  await page.getByRole('button', { name: 'Eliminar tipo de variante', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar', exact: true }).click();
  await expect(page.getByText(/Reasigna primero todos los productos/)).toBeVisible();
  await expect(page.locator('output')).toHaveText('used');
  expect(state.writes.map(write => write.method)).toEqual(['DELETE']);
});

test('read-only catalog users can select but have no master mutation actions', async ({ page }) => {
  const state = await setup(page, true);
  await page.locator('input').first().click();
  await expect(page.getByTitle('Editar tipo de variante')).toHaveCount(0);
  await page.locator('input').first().fill('Material');
  await page.getByText('Material', { exact: true }).click();
  await expect(page.locator('output')).toHaveText('free');
  expect(state.writes).toEqual([]);
});
