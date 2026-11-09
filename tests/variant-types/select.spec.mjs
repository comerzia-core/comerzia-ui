import { test, expect } from '@playwright/test';

async function setup(page, readOnly = false, edit = false) {
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
  await page.goto('/tests/variant-types/index.html' + (edit ? '?edit' : readOnly ? '?readonly' : ''));
  await expect(page.getByPlaceholder('Buscar o crear...')).toHaveValue('Color');
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

test('new type stays selected in edit modal through a background product refresh and is saved', async ({ page }) => {
  await setup(page, false, true);
  let saved;
  await page.route('**/api/tenant/products/product', route => {
    saved = route.request().postDataJSON();
    return route.fulfill({ json: {} });
  });
  await page.getByLabel('Nombre del Producto').fill('Product edited');
  const input = page.getByPlaceholder('Buscar o crear...');
  await input.click();
  await input.fill('Textura');
  await page.getByText(/Crear.*TEXTURA/).click();
  await expect(input).toHaveValue('TEXTURA');
  await page.evaluate(() => window.dispatchEvent(new Event('fixture-product-refresh')));
  await expect(input).toHaveValue('TEXTURA');
  await expect(page.getByLabel('Nombre del Producto')).toHaveValue('PRODUCT EDITED');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => saved?.variantType).toBe('new');
});

test('long options escape modal clipping and remain scrollable and clickable', async ({ page }) => {
  const state = await setup(page);
  state.rows.push(...Array.from({ length: 40 }, (_, index) => ({ id: 'type-' + index, name: 'Type ' + index })));
  await page.goto('/tests/variant-types/index.html?edit');
  const input = page.getByPlaceholder('Buscar o crear...');
  await expect(input).toHaveValue('Color');
  await input.click();
  await input.fill('Type');
  const last = page.getByText('Type 39', { exact: true });
  await last.scrollIntoViewIfNeeded();
  expect(await last.evaluate(element => element.closest('[role="dialog"]') === null)).toBe(true);
  const bounds = await last.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
  await last.click();
  await expect(input).toHaveValue('Type 39');
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
