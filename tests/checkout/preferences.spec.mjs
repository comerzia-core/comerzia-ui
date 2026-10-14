import { test, expect } from '@playwright/test';

const sale = { id: 'sale', saleNumber: 'TEST-01', date: '2026-10-13T15:00:00Z', totalAmount: 10, subtotalAmount: 10, discountedAmount: 0, employeeName: 'Test', details: [] };
async function mockApi(page) {
  const state = { paid: false, prints: 0, agents: 0, saved: null };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let data = {};
    if (url.pathname.endsWith('/sales/pending')) data = state.paid ? [] : [sale];
    else if (url.pathname.endsWith('/sale/pay')) { state.paid = true; data = sale; }
    else if (url.pathname.endsWith('/my-active-summary')) data = { id: 'shift', openingAmount: 0, totalSales: 0, totalInflows: 0, totalOutflows: 0 };
    else if (url.pathname.endsWith('/hardware/agents')) { state.agents++; data = { content: [] }; }
    else if (url.pathname.endsWith('/hardware/print-jobs')) { state.prints++; data = { id: 'job' }; }
    else if (url.pathname.endsWith('/company/settings')) { state.saved = route.request().postDataJSON(); data = state.saved; }
    else if (url.pathname.endsWith('/company/profile')) data = { legalName: 'Company', commercialName: 'Company', slug: 'company', taxId: 'test', currencyCode: 'BOB', timezone: 'America/La_Paz', taxPercentage: 0, currentSubscription: null, saleCustomerRegistrationEnabled: true, receiptPrintingEnabled: true, ...state.saved };
    else if (url.pathname.endsWith('/auth/profile')) data = { roles: ['OWNER'], permissions: [], companySettings: state.saved };
    await route.fulfill({ json: data });
  });
  return state;
}

for (const mobile of [false, true]) for (const receipt of [false, true]) for (const customer of [false, true]) {
  test(`checkout receipt=${receipt} customer=${customer} mobile=${mobile}`, async ({ page }) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    const state = await mockApi(page);
    await page.goto(`/tests/checkout/index.html?receipt=${receipt}&customer=${customer}`);
    await page.getByRole('button', { name: 'Cobrar Venta' }).click();
    await page.getByRole('button', { name: 'Confirmar Pago' }).click();
    await expect.poll(() => state.paid).toBe(true);
    if (receipt) {
      await expect(page.getByRole('dialog').getByRole('button', { name: 'Imprimir Ticket' })).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click();
    }
    if (customer) await expect(page.getByRole('dialog').getByText('Asignar Cliente - Venta #TEST-01')).toBeVisible();
    else await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(state.prints).toBe(0);
    if (!receipt) {
      expect(state.agents).toBe(0);
      await expect(page.getByText('Tickera desconectada')).toHaveCount(0);
    }
  });
}

for (const receipt of [false, true]) test(`auto print respects company receipt=${receipt}`, async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/tests/checkout/index.html?receipt=${receipt}&customer=false&auto=true`);
  await page.getByRole('button', { name: 'Cobrar Venta' }).click();
  await page.getByRole('button', { name: 'Confirmar Pago' }).click();
  await expect.poll(() => state.paid).toBe(true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => state.prints).toBe(receipt ? 1 : 0);
});

test('older company profiles retain both prompts', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/checkout/index.html?legacy=1');
  await page.getByRole('button', { name: 'Cobrar Venta' }).click();
  await page.getByRole('button', { name: 'Confirmar Pago' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Imprimir Ticket' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Asignar Cliente - Venta #TEST-01')).toBeVisible();
});

for (const mobile of [false, true]) test(`company saves independent switches mobile=${mobile}`, async ({ page }) => {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  const state = await mockApi(page); await page.goto('/tests/checkout/index.html?view=company');
  const customer = page.getByText('Registrar cliente al cobrar', { exact: true }).locator('../..');
  const receipt = page.getByText('Imprimir factura / ticket al cobrar', { exact: true }).locator('../..');
  await customer.getByTitle('Activo', { exact: true }).click();
  await receipt.getByTitle('Activo', { exact: true }).click();
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect.poll(() => state.saved?.saleCustomerRegistrationEnabled).toBe(false);
  expect(state.saved.receiptPrintingEnabled).toBe(false);
  await expect(customer.getByTitle('Inactivo', { exact: true })).toBeVisible();
  await expect(receipt.getByTitle('Inactivo', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
