import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const image = `data:image/png;base64,${fs.readFileSync(new URL('../../../comerzia/build/label-validation/label3columns.png', import.meta.url)).toString('base64')}`;
const field = (page, label) => {
  const text = new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\*?$');
  return page.getByRole('dialog').locator('.form-control').filter({ has: page.getByText(text) }).locator('input');
};

async function mockApi(page) {
  const sent = [], saved = [], previews = [];
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    let body;
    if (path.endsWith('/generic/dictionaries')) body = { 'hw-print-job-status': [{ code: 1144, label: 'Completado' }] };
    else if (path.includes('/lookups/')) {
      const key = path.split('/').at(-1);
      body = { content: key === 'label-roll-size' ? [{ value: 'three', label: 'Tres columnas' }, { value: 'two', label: 'Dos columnas' }, { value: 'small', label: '30×20 · Tres columnas' }, { value: 'tiny', label: '20×20 · Solo QR' }] : [{ value: key === 'label-variant' ? 'variant' : 'printer', label: 'Unidad' }], totalPages: 1 };
    } else if (path.includes('/content/')) body = { variantId: 'variant', productName: 'Producto', variantName: 'Unidad', barcode: '7003000100006', logoAvailable: true, priceAvailable: true, price: 12.5, priceMessage: null };
    else if (path.endsWith('/options')) {
      const small = url.searchParams.get('rollSizeId') === 'small', tiny = url.searchParams.get('rollSizeId') === 'tiny';
      body = { codeFormat: small || tiny ? 'QR_CODE' : 'CODE_128', codeFormatLabel: small || tiny ? 'QR' : 'CODE128', logoAllowed: !tiny, priceAllowed: !tiny, nameAllowed: !tiny, message: small ? 'QR automático para este rollo pequeño.' : null };
    }
    else if (path.includes('/devices/')) body = { id: 'printer', reachable: true, ready: true, lastCheckedAt: new Date().toISOString(), statusKnown: false };
    else if (path.endsWith('/preview')) {
      previews.push(request.postDataJSON());
      const columns = request.postDataJSON().rollSizeId === 'two' ? 2 : 3;
      const small = request.postDataJSON().rollSizeId === 'small';
      body = { previewId: 'preview', imageDataUrl: small ? `data:image/png;base64,${fs.readFileSync(new URL('../../../comerzia/build/label-validation/label30x20-qr-3columns.png', import.meta.url)).toString('base64')}` : image, widthMm: small ? 30 : 31, heightMm: small ? 20 : 57, gapMm: 2, columns, columnGapMm: small ? 2 : 1.5, totalWidthMm: small ? 94 : columns === 3 ? 96 : 63.5, rotation: small ? 0 : 90, displayName: 'Unidad', expiresAt: '2099-01-01T00:00:00Z' };
    } else if (path.endsWith('/print')) {
      sent.push(request.postDataJSON()); body = { id: 'job', status: 1144 };
    } else if (path.endsWith('/roll-sizes')) {
      if (request.method() === 'POST') { saved.push(request.postDataJSON()); body = { id: 'roll', ...request.postDataJSON() }; }
      else body = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
    } else throw new Error(`Unexpected API request: ${request.method()} ${path}`);
    await route.fulfill({ json: body });
  });
  return { sent, saved, previews };
}

test('small-roll QR offers optional details and follows backend restrictions when changing rolls', async ({ page }) => {
  const { previews, sent } = await mockApi(page); await page.goto('/tests/labels/index.html');
  await expect(field(page, 'Cantidad total de etiquetas')).toHaveValue('3');
  await page.getByRole('combobox').nth(1).selectOption('small');
  await expect(page.getByText('Formato: QR.', { exact: false })).toBeVisible();
  await expect(page.getByText('Ancho total 94 mm', { exact: false })).toBeVisible();
  const toggle = text => page.getByRole('dialog').locator('label').filter({ hasText: new RegExp('^' + text + '$') }).locator('div[title]').first();
  for (const name of ['Logo', 'Precio', 'Nombre del producto']) {
    await expect(toggle(name)).toHaveAttribute('title', 'Activo'); await toggle(name).click();
    await expect(toggle(name)).toHaveAttribute('title', 'Inactivo');
  }
  await expect.poll(() => previews.at(-1)).toEqual({ variantId: 'variant', rollSizeId: 'small', includeLogo: false, includePrice: false, includeName: false });
  await page.getByRole('combobox').nth(1).selectOption('tiny');
  for (const name of ['Logo', 'Precio', 'Nombre del producto']) {
    await expect(toggle(name)).toHaveClass(/cursor-not-allowed/); await toggle(name).click();
    await expect(toggle(name)).toHaveAttribute('title', 'Inactivo');
  }
  await page.getByRole('combobox').nth(1).selectOption('small');
  await expect(page.getByRole('button', { name: 'Imprimir etiquetas', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Imprimir etiquetas', exact: true }).click();
  expect(sent).toEqual([{ previewId: 'preview', deviceId: 'printer', quantity: 3 }]);
});

test('default quantity matches columns, partial rows are blocked, six labels are sent once', async ({ page }) => {
  const { sent } = await mockApi(page);
  await page.goto('/tests/labels/index.html');
  const quantity = field(page, 'Cantidad total de etiquetas'), print = page.getByRole('button', { name: 'Imprimir etiquetas', exact: true });
  await expect(quantity).toHaveValue('3'); await expect(quantity).toHaveAttribute('step', '3');
  await expect(page.getByText('Ancho total 96 mm', { exact: false })).toBeVisible();
  await expect(print).toBeEnabled();
  await quantity.fill('4'); await expect(print).toBeDisabled(); await expect(page.getByText('Ingrese un múltiplo de 3 entre 3 y 999 etiquetas.')).toBeVisible();
  await quantity.fill('6'); await expect(page.getByText('Se imprimirán 2 filas (6 etiquetas).', { exact: false })).toBeVisible();
  await print.click(); await expect(page.getByText('Trabajo de impresión: Completado')).toBeVisible();
  expect(sent).toEqual([{ previewId: 'preview', deviceId: 'printer', quantity: 6 }]);
  await expect(print).toBeDisabled();
});

test('changing roll updates minimum, step, maximum and quantity to complete rows', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/labels/index.html');
  const quantity = field(page, 'Cantidad total de etiquetas');
  await expect(quantity).toHaveValue('3');
  await page.getByRole('combobox').nth(1).selectOption('two');
  await expect(quantity).toHaveValue('2'); await expect(quantity).toHaveAttribute('step', '2'); await expect(quantity).toHaveAttribute('max', '1000');
  await quantity.fill('3'); await expect(page.getByRole('button', { name: 'Imprimir etiquetas', exact: true })).toBeDisabled();
  await page.getByRole('combobox').nth(1).selectOption('three');
  await expect(quantity).toHaveValue('3'); await expect(quantity).toHaveAttribute('step', '3');
});

test('roll editor sends independent gaps and rejects an oversized row', async ({ page }) => {
  const { saved } = await mockApi(page); await page.goto('/tests/labels/index.html?view=rolls');
  await page.getByRole('button', { name: 'Nuevo tamaño' }).click();
  await field(page, 'Nombre').fill('Tres columnas'); await field(page, 'Ancho de cada etiqueta (mm)').fill('31');
  await field(page, 'Alto de cada etiqueta (mm)').fill('57'); await field(page, 'GAP entre filas (mm)').fill('2');
  await expect(field(page, 'Separación entre columnas (mm)')).toBeDisabled();
  await field(page, 'Columnas').fill('4'); await field(page, 'Separación entre columnas (mm)').fill('1.5');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('El ancho total de las columnas y sus separaciones no puede superar 108 mm.')).toBeVisible(); expect(saved).toHaveLength(0);
  await field(page, 'Columnas').fill('3'); await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(saved).toEqual([{ name: 'Tres columnas', widthMm: 31, heightMm: 57, gapMm: 2, columns: 3, columnGapMm: 1.5, active: false }]);
});
