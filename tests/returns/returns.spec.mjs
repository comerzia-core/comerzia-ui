import { test, expect } from '@playwright/test';

const sale = { id: 'sale-b', saleNumber: 'SALE-B', branchId: 'branch-b', branchName: 'Tienda B',
  saleStatus: 602, totalAmount: 10, subtotalAmount: 10, discountedAmount: 0, date: '2026-10-20T01:00:00Z', employeeName: 'Beta' };
const shift = { id: 'shift-b', cashName: 'Caja B', branchName: 'Tienda B', employeeName: 'Beta',
  openedAt: '2026-10-20T01:00:00Z', closedAt: null, statusType: { code: 1, label: 'Abierta' },
  totalInflows: 50, totalOutflows: 10, closeAllowed: true, reopenAllowed: false, payments: [] };
async function mockApi(page) {
  const state = { eligible: true, contextReads: 0, post: null, postError: null, inflows: 50, availableShifts: [shift] };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data = {}, status = 200;
    if (path.endsWith('/sales/search')) data = { content: [sale], totalPages: 1, totalElements: 1 };
    else if (path.endsWith('/sales/sellers')) data = [{ id: 'employee', username: 'beta', fullName: 'Beta' }];
    else if (path.endsWith('/sales/number/SALE-B')) data = sale;
    else if (path.endsWith('/sales/sale-b/details')) data = [{ id: 'detail', productName: 'Producto prueba', measureUnitName: 'Unidad',
      receiptQuantity: 1, equivalenceFactor: 1, returnedQuantity: 0, physicalUnitFinalPrice: 10, lineTotalFinal: 10, lineTotalSuggested: 10, lineTotalDiscount: 0 }];
    else if (path.endsWith('/return-context')) {
      state.contextReads++;
      if (state.eligible) data = { availableShifts: state.availableShifts };
      else { status = 409; data = { errorCode: 'return_shift_unavailable', message: 'Internal English details' }; }
    } else if (path.endsWith('/return-quote')) {
      const details = route.request().postDataJSON().returnDetails.map(item => ({ ...item,
        subtotalRefund: item.quantityToReturn * 10, discountRefund: 0, totalRefund: item.quantityToReturn * 10 }));
      data = { details, subtotalRefund: details.reduce((total, item) => total + item.subtotalRefund, 0), discountRefund: 0,
        totalRefund: details.reduce((total, item) => total + item.totalRefund, 0) };
    } else if (path.endsWith('/returns') && route.request().method() === 'POST') {
      state.post = route.request().postDataJSON();
      if (state.postError) { status = 409; data = { errorCode: state.postError, message: 'Internal English details' }; }
      else data = { id: 'return', totalRefundAmount: 10 };
    } else if (path.endsWith('/sales/sale-b/pay')) {
      status = 409; data = { code: 'shift_branch_mismatch', message: 'Internal English details' };
    } else if (path.endsWith('/shifts/summaries')) data = { content: [
      { ...shift, totalInflows: state.inflows },
      { ...shift, id: 'closed-shift', cashName: 'Caja cerrada', closedAt: '2026-10-20T02:00:00Z', statusType: { code: 2, label: 'Cerrada' }, closeAllowed: false, reopenAllowed: true },
    ], totalPages: 1, totalElements: 2 };
    else if (path.endsWith('/cash-registers/register/shifts')) data = { content: [
      { id: 'closed-shift', openedAt: shift.openedAt, closedAt: '2026-10-20T02:00:00Z', cashierName: 'Beta', reopenAllowed: true, statusType: { code: 2, label: 'Cerrada' } },
    ], totalElements: 1, totalPages: 1 };
    else if (path.includes('dictionar')) data = { 'payment-type': [{ code: 701, label: 'Efectivo' }] };
    await route.fulfill({ status, json: data });
  });
  return state;
}

async function openSaleMenu(page, mobile) {
  const saleNumber = page.getByText('#SALE-B', { exact: true }).filter({ visible: true }).first();
  await expect(saleNumber).toBeVisible();
  await saleNumber.click({ button: mobile ? 'left' : 'right' });
}

for (const role of ['OWNER', 'BRANCH_MANAGER', 'CASHIER']) test(`history filters and preflight before navigation ${role}`, async ({ page }, info) => {
  const state = await mockApi(page);
  await page.goto(`/tests/returns/index.html?role=${role}`);
  await expect(page.getByText('Periodo', { exact: true })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: /^Vendedor$/ })).toBeVisible();
  state.eligible = false;
  await openSaleMenu(page, info.project.name === 'mobile');
  await page.getByText('Procesar Devolución', { exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Abre un turno');
  expect(new URL(page.url()).pathname).toBe('/sales/history');
  state.eligible = true;
  await openSaleMenu(page, info.project.name === 'mobile');
  await page.getByText('Procesar Devolución', { exact: true }).click();
  await expect(page).toHaveURL(/\/sales\/returns\/SALE-B/);
  await expect.poll(() => state.contextReads).toBeGreaterThanOrEqual(3);
  await expect(page.getByText('Caja B', { exact: true }).first()).toBeVisible();
});

test('a direct return URL stays blocked when the shift is unavailable', async ({ page }) => {
  const state = await mockApi(page); state.eligible = false;
  await page.goto('/tests/returns/index.html?path=/sales/returns/SALE-B');
  await expect(page.getByText('Abre un turno', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /Procesar Devoluci/ })).toBeDisabled();
  expect(state.post).toBeNull();
  await expect(page.getByText('Internal English details')).toHaveCount(0);
});

for (const role of ['CASHIER', 'BRANCH_MANAGER']) test(`daily reopen visibility follows permissions ${role}`, async ({ page }, info) => {
  await mockApi(page);
  await page.goto(`/tests/returns/index.html?role=${role}&path=/pos/shifts`);
  const row = page.getByText('Caja cerrada', { exact: true }).filter({ visible: true }).first();
  if (role === 'CASHIER') await expect(page.getByRole('button', { name: 'Abrir turno', exact: true })).toBeDisabled();
  else await expect(page.getByRole('button', { name: 'Abrir turno', exact: true })).toBeEnabled();
  await row.click({ button: info.project.name === 'mobile' ? 'left' : 'right' });
  if (role === 'CASHIER') await expect(page.getByText('Reabrir turno', { exact: true })).toHaveCount(0);
  else await expect(page.getByText('Reabrir turno', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const role of ['OWNER', 'BRANCH_MANAGER']) test(`cash register history only offers reopening to the owner ${role}`, async ({ page }, info) => {
  await mockApi(page);
  await page.goto(`/tests/returns/index.html?role=${role}&path=/pos/registers/register/history`);
  const row = page.getByText('Beta', { exact: true }).filter({ visible: true }).first();
  await row.click({ button: info.project.name === 'mobile' ? 'left' : 'right' });
  if (role === 'OWNER') await expect(page.getByText('Reabrir Turno', { exact: true })).toBeVisible();
  else await expect(page.getByText('Reabrir Turno', { exact: true })).toHaveCount(0);
});

test('date ranges use the company day even when the browser uses another zone', async ({ page }) => {
  await mockApi(page);
  await page.goto('/tests/returns/index.html');
  expect(await page.evaluate(() => window.returnTest.range('2026-10-20T01:00:00Z')))
    .toEqual({ start: '2026-10-19', end: '2026-10-19' });
});

for (const closesBeforeSubmit of [false, true]) test(`return always sends the selected shift and handles closure ${closesBeforeSubmit}`, async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/tests/returns/index.html?path=/sales/returns/SALE-B');
  await expect(page.getByText('Caja B', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Devolver Todo', exact: true }).click();
  await page.getByPlaceholder('Ej. Producto defectuoso, error en pedido...').fill('Cambio de producto');
  await page.getByRole('button', { name: 'Procesar Devolución', exact: true }).click();
  if (closesBeforeSubmit) { state.postError = 'return_shift_unavailable'; state.eligible = false; }
  await page.getByRole('button', { name: 'Sí, Procesar', exact: true }).click();
  await expect.poll(() => state.post?.targetShiftId).toBe('shift-b');
  expect(state.post.returnDetails).toEqual([{ saleDetailId: 'detail', quantityToReturn: 1 }]);
  await expect(page.getByRole('alert')).toContainText(closesBeforeSubmit ? 'Abre un turno' : 'Devolución registrada.');
  await expect(page.getByText('Internal English details')).toHaveCount(0);
});

test('multiple eligible cash registers require an explicit selection', async ({ page }) => {
  const state = await mockApi(page);
  state.availableShifts.push({ ...shift, id: 'shift-c', cashName: 'Caja C', employeeName: 'Gamma' });
  await page.goto('/tests/returns/index.html?role=OWNER&path=/sales/returns/SALE-B');
  await expect(page.getByText('Caja C', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Devolver Todo', exact: true }).click();
  await page.getByPlaceholder('Ej. Producto defectuoso, error en pedido...').fill('Cambio de producto');
  await expect(page.getByRole('button', { name: 'Procesar Devolución', exact: true })).toBeDisabled();
  await page.getByText('Caja C', { exact: true }).click();
  await page.getByRole('button', { name: 'Procesar Devolución', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, Procesar', exact: true }).click();
  await expect.poll(() => state.post?.targetShiftId).toBe('shift-c');
});

test('payment branch mismatch is translated without exposing internal messages', async ({ page }) => {
  await mockApi(page);
  await page.goto('/tests/returns/index.html?path=/sales/pay');
  await page.getByRole('button', { name: 'Confirmar Pago', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('La caja debe pertenecer a la tienda de la venta.');
  await expect(page.getByText('Internal English details')).toHaveCount(0);
});
