import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const image = `data:image/png;base64,${fs.readFileSync(new URL('../../../comerzia/build/label-validation/label30x20-qr-3columns.png', import.meta.url)).toString('base64')}`;
const calibrationDialog = page => page.getByRole('dialog').filter({ has: page.getByText(/^Rollo instalado\s*\*?$/) });
const feedToggle = page => calibrationDialog(page).locator('label').filter({ hasText: 'FEED avanza una fila y queda alineada' }).locator('div[title]');

async function mockCalibration(page, { supported = true, busy = false } = {}) {
  const requests = [], confirmations = [], printed = [];
  const single = { id: 'single', name: '31×57', widthMm: 31, heightMm: 57, gapMm: 2, columns: 1, columnGapMm: 0, active: true };
  const small = { id: 'small', name: '30×20 tres columnas', widthMm: 30, heightMm: 20, gapMm: 2, columns: 3, columnGapMm: 2, active: true };
  let device = { id: 'printer', name: 'PHILO 470B', deviceType: 1111, reachable: true, ready: true, calibrationSupported: supported,
    loadedRollSizeId: 'single', loadedRollName: single.name, calibrationJobId: 'previous', calibrationStatus: 1144,
    lastCalibratedAt: '2026-10-12T18:00:00Z', rollVerifiedAt: '2026-10-12T18:01:00Z', statusKnown: false };
  let job = { id: 'previous', status: 1144 };
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    let body;
    if (path.endsWith('/generic/dictionaries')) body = { 'hw-print-job-status': [
      { code: 1141, label: 'Pendiente' }, { code: 1142, label: 'Enviado' }, { code: 1143, label: 'Imprimiendo' },
      { code: 1144, label: 'Completado' }, { code: 1145, label: 'Fallido' }, { code: 1146, label: 'Cancelado' },
    ] };
    else if (path.includes('/lookups/')) {
      const key = path.split('/').at(-1);
      body = { content: key === 'label-roll-size' ? [single, small].map(roll => ({ value: roll.id, label: roll.name }))
        : [{ value: key === 'label-variant' ? 'variant' : 'printer', label: 'Unidad' }], totalPages: 1 };
    } else if (path.includes('/roll-sizes/')) body = path.endsWith('/small') ? small : single;
    else if (path.endsWith('/calibrations')) {
      requests.push(request.postDataJSON());
      if (busy) { await route.fulfill({ status: 400, json: { message: 'La impresora tiene trabajos pendientes o en curso.' } }); return; }
      const roll = request.postDataJSON().rollSizeId === 'small' ? small : single;
      job = { id: 'calibration', status: 1142 };
      device = { ...device, loadedRollSizeId: roll.id, loadedRollName: roll.name, calibrationJobId: job.id,
        calibrationStatus: job.status, lastCalibratedAt: null, rollVerifiedAt: null };
      body = job;
    } else if (path.endsWith('/confirmation')) {
      confirmations.push(request.postDataJSON());
      device = { ...device, rollVerifiedAt: new Date().toISOString() }; body = device;
    } else if (path.includes('/devices/')) body = { ...device, lastCheckedAt: new Date().toISOString() };
    else if (path.includes('/print-jobs/')) body = job;
    else if (path.includes('/content/')) body = { variantId: 'variant', productName: 'Producto', variantName: 'Unidad', barcode: '7003000100006', logoAvailable: false, priceAvailable: false };
    else if (path.endsWith('/options')) body = { codeFormat: 'QR_CODE', codeFormatLabel: 'QR', logoAllowed: true, priceAllowed: true, nameAllowed: true };
    else if (path.endsWith('/preview')) {
      const roll = request.postDataJSON().rollSizeId === 'small' ? small : single;
      body = { previewId: 'preview', imageDataUrl: image, ...roll, totalWidthMm: roll.id === 'small' ? 94 : 31, rotation: 0, displayName: 'Unidad' };
    } else if (path.endsWith('/print')) { printed.push(request.postDataJSON()); body = { id: 'print', status: 1144 }; }
    else throw new Error(`Unexpected API request: ${request.method()} ${path}`);
    await route.fulfill({ json: body });
  });
  return { requests, confirmations, printed,
    complete: () => { job = { ...job, status: 1144 }; device = { ...device, calibrationStatus: 1144, lastCalibratedAt: new Date().toISOString() }; },
    fail: () => { job = { ...job, status: 1145, errorMessage: 'Las medidas detectadas no coinciden con el rollo.' }; device = { ...device, calibrationStatus: 1145 }; },
  };
}

test('calibration is manual, sends the selected roll once and requires physical FEED confirmation', async ({ page }) => {
  const api = await mockCalibration(page); await page.goto('/tests/labels/index.html?view=calibration');
  const dialog = calibrationDialog(page), calibrate = dialog.getByRole('button', { name: 'Calibrar', exact: true });
  await expect(calibrate).toBeEnabled(); expect(api.requests).toHaveLength(0);
  await dialog.getByRole('combobox').selectOption('small');
  await expect(dialog.getByText('3 columnas', { exact: false })).toBeVisible(); expect(api.requests).toHaveLength(0);
  await calibrate.click(); await expect(calibrate).toBeDisabled(); expect(api.requests).toEqual([{ rollSizeId: 'small' }]);
  api.complete();
  const confirm = dialog.getByRole('button', { name: 'Confirmar', exact: true });
  await expect(confirm).toBeDisabled(); expect(api.confirmations).toHaveLength(0);
  await feedToggle(page).click(); await expect(confirm).toBeEnabled(); await confirm.click();
  await expect(dialog.getByText('Avance confirmado. Puedes imprimir con este rollo.')).toBeVisible();
  expect(api.confirmations).toEqual([{ feedAligned: true }]); expect(api.requests).toHaveLength(1);
});

test('closing and reopening resumes the existing calibration without moving paper again', async ({ page }) => {
  const api = await mockCalibration(page); await page.goto('/tests/labels/index.html?view=calibration');
  const dialog = calibrationDialog(page);
  await expect(dialog.getByRole('button', { name: 'Calibrar', exact: true })).toBeEnabled();
  await dialog.getByRole('combobox').selectOption('small');
  await dialog.getByRole('button', { name: 'Calibrar', exact: true }).click();
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  api.complete(); await page.getByRole('button', { name: 'Reabrir calibración' }).click();
  await expect(calibrationDialog(page).getByRole('button', { name: 'Confirmar', exact: true })).toBeDisabled();
  await expect(calibrationDialog(page).getByRole('combobox')).toHaveValue('small');
  expect(api.requests).toHaveLength(1); expect(api.confirmations).toHaveLength(0);
});

test('an old agent disables calibration and an occupied queue shows the backend explanation', async ({ page }) => {
  const old = await mockCalibration(page, { supported: false }); await page.goto('/tests/labels/index.html?view=calibration');
  await expect(page.getByText('Actualiza Comerzia Print Agent', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Calibrar', exact: true })).toBeDisabled(); expect(old.requests).toHaveLength(0);
  await page.unroute('**/api/**');
  const busy = await mockCalibration(page, { busy: true }); await page.reload();
  await expect(page.getByRole('button', { name: 'Calibrar', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Calibrar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('La impresora tiene trabajos pendientes o en curso.');
  expect(busy.confirmations).toHaveLength(0);
});

test('an unconfirmed completed calibration allows a different roll only through a new manual request', async ({ page }) => {
  const api = await mockCalibration(page); await page.goto('/tests/labels/index.html?view=calibration');
  const dialog = calibrationDialog(page), calibrate = dialog.getByRole('button', { name: 'Calibrar', exact: true });
  await expect(calibrate).toBeEnabled(); await calibrate.click(); api.complete();
  const confirm = dialog.getByRole('button', { name: 'Confirmar', exact: true });
  await expect(confirm).toBeDisabled(); await feedToggle(page).click(); await expect(confirm).toBeEnabled();
  await dialog.getByRole('combobox').selectOption('small');
  await expect(confirm).toHaveCount(0); expect(api.requests).toEqual([{ rollSizeId: 'single' }]);
  await expect(calibrate).toBeEnabled(); await calibrate.click();
  expect(api.requests).toEqual([{ rollSizeId: 'single' }, { rollSizeId: 'small' }]); expect(api.confirmations).toHaveLength(0);
  api.complete(); await expect(confirm).toBeDisabled();
});

test('a failed calibration is visible and is never confirmed or retried automatically', async ({ page }) => {
  const api = await mockCalibration(page); await page.goto('/tests/labels/index.html?view=calibration');
  const calibrate = page.getByRole('button', { name: 'Calibrar', exact: true });
  await expect(calibrate).toBeEnabled(); await calibrate.click(); api.fail();
  await expect(page.getByRole('alert')).toHaveText('Las medidas detectadas no coinciden con el rollo.');
  await expect(calibrate).toBeEnabled(); expect(api.requests).toHaveLength(1); expect(api.confirmations).toHaveLength(0);
});

test('catalog blocks a different roll and opens calibration with the selected format', async ({ page }) => {
  const api = await mockCalibration(page); await page.goto('/tests/labels/index.html?view=catalog-calibration');
  const print = page.getByRole('button', { name: 'Imprimir', exact: true });
  await expect(print).toBeEnabled(); await page.getByRole('combobox').nth(1).selectOption('small');
  await expect(print).toBeDisabled(); await expect(page.getByText('El rollo no coincide', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Calibrar', exact: true }).click();
  await expect(calibrationDialog(page).getByRole('combobox')).toHaveValue('small');
  const calibrate = calibrationDialog(page).getByRole('button', { name: 'Calibrar', exact: true });
  await expect(calibrate).toBeEnabled(); await calibrate.click(); api.complete();
  const confirm = calibrationDialog(page).getByRole('button', { name: 'Confirmar', exact: true });
  await expect(confirm).toBeDisabled(); await feedToggle(page).click(); await confirm.click();
  await expect(calibrationDialog(page).getByText('Avance confirmado. Puedes imprimir con este rollo.')).toBeVisible();
  await calibrationDialog(page).getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(print).toBeEnabled(); await print.click();
  expect(api.printed).toEqual([{ previewId: 'preview', deviceId: 'printer', quantity: 3 }]); expect(api.requests).toHaveLength(1);
});
