import { test, expect } from '@playwright/test';

async function captureApi(page) {
  const submissions = [];
  await page.route('**/api/**', async route => {
    const request = route.request();
    if (['POST', 'PUT'].includes(request.method()) && request.url().includes('/tenant/product-variants')) {
      submissions.push({ method: request.method(), body: request.postDataJSON() });
      await route.fulfill({ json: { id: 'variant', ...request.postDataJSON() } });
    } else {
      await route.fulfill({ json: { available: true } });
    }
  });
  return submissions;
}

test('creating an internal variant submits its generation mode without requiring a scanned code', async ({ page }) => {
  const submissions = await captureApi(page);
  await page.goto('/tests/product-variants/index.html');
  await page.getByRole('textbox', { name: /Nombre\/Atributo/ }).fill('BLUE');
  await page.getByRole('switch').click();
  await expect(page.getByRole('textbox', { name: 'Código de Barras' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => submissions.length).toBe(1);
  expect(submissions[0]).toMatchObject({ method: 'POST', body: { name: 'BLUE', productId: 'product', isInternalBarcode: true } });
  expect(submissions[0].body).not.toHaveProperty('barCode');
  await expect(page.getByText('Variante creada exitosamente.')).toBeVisible();
});

test('creating an external variant without a code is blocked before sending', async ({ page }) => {
  const submissions = await captureApi(page);
  await page.goto('/tests/product-variants/index.html');
  await page.getByRole('textbox', { name: /Nombre\/Atributo/ }).fill('BLUE');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Ingresa el código de barras.')).toBeVisible();
  expect(submissions).toEqual([]);
});

for (const mode of ['internal', 'external']) {
  test(`editing an ${mode} variant hides generation and preserves the read-only code`, async ({ page }) => {
    const submissions = await captureApi(page);
    await page.goto(`/tests/product-variants/index.html?mode=${mode}`);
    await expect(page.getByText('Generar código de barras internamente')).toHaveCount(0);
    const barcode = page.getByRole('textbox', { name: 'Código de Barras' });
    await expect(barcode).toHaveValue('2000000000015');
    await expect(barcode).toHaveAttribute('readonly', '');
    await expect(page.getByRole('button', { name: 'Escanear con cámara' })).toHaveCount(0);
    await page.getByRole('textbox', { name: /Nombre\/Atributo/ }).fill('UPDATED');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect.poll(() => submissions.length).toBe(1);
    expect(submissions[0]).toMatchObject({ method: 'PUT', body: { name: 'UPDATED', status: true } });
    expect(submissions[0].body).not.toHaveProperty('barCode');
    expect(submissions[0].body).not.toHaveProperty('isInternalBarcode');
    await expect(page.getByText('Variante actualizada exitosamente.')).toBeVisible();
  });
}
