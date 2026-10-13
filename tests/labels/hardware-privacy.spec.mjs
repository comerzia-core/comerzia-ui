import { test, expect } from '@playwright/test';

for (const mobile of [false, true]) test(`hardware job list and details hide identifiers and technical payload (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  await page.route('**/api/**', route => route.fulfill({ json: {
    'hw-print-job-type': [{ code: 1131, label: 'Etiquetas' }], 'hw-print-job-status': [{ code: 1145, label: 'Fallido' }],
  } }));
  await page.goto('/tests/labels/index.html?view=jobs');
  await expect(mobile ? page.locator('article').first().getByText('Impresora visible', { exact: false }) : page.getByRole('row').filter({ hasText: 'Impresora visible' })).toBeVisible();
  const assertPrivate = async () => {
    const text = await page.locator('body').innerText();
    expect(text).not.toContain('PRIVATE-'); expect(text).not.toContain('ID:'); expect(text).not.toContain('Payload');
    expect(text).not.toContain('Fecha y Hora:');
  };
  await assertPrivate();
  if (mobile) await page.locator('article').first().click();
  else await page.getByRole('row').filter({ hasText: 'Impresora visible' }).click({ button: 'right' });
  await page.getByText('Ver detalle del trabajo', { exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await assertPrivate();
  await expect(page.getByRole('dialog').getByText('Sin papel')).toBeVisible();
});
