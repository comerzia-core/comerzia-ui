import { test, expect } from '@playwright/test';

const sale = { id: 'sale', saleNumber: 'RT-001', date: '2026-10-13T15:00:00Z', totalAmount: 10, subtotalAmount: 10, discountedAmount: 0, employeeName: 'Test', details: [] };
async function mockApi(page) {
  const state = { sales: [], name: 'Original product', description: 'Original description', pendingReads: 0, productReads: 0, shiftReads: 0, inflows: 722.20, outflows: 120, delay: 0, status: 200 };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data = {};
    if (path.endsWith('/sales/pending')) { state.pendingReads++; data = state.sales; }
    else if (path.endsWith('/active-summaries')) {
      state.shiftReads++; data = [{ id: 'shift', cashName: 'Realtime register', branchName: 'Main',
        employeeName: 'Test Cashier', openedAt: '2026-10-14T12:00:00Z',
        totalInflows: state.inflows, totalOutflows: state.outflows, paymentSummaries: [] }];
    }
    else if (path.endsWith('/my-active-summary')) data = { id: 'shift', openingAmount: 0, totalSales: 0, totalInflows: 0, totalOutflows: 0 };
    else if (path.endsWith('/products')) {
      state.productReads++;
      data = { content: [{ id: 'product', name: state.name, description: state.description, status: true,
        variantName: 'Simple', brand: { id: 'brand', name: 'Test brand' } }], totalElements: 1, totalPages: 1, number: 0, size: 5 };
    }
    if (state.delay) await new Promise(resolve => setTimeout(resolve, state.delay));
    await route.fulfill({ status: state.status, json: state.status >= 500 ? { message: 'Temporary server failure' } : data });
  });
  return state;
}

for (const mobile of [false, true]) test(`cashier receives creation and payment without reload mobile=${mobile}`, async ({ page }) => {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  const state = await mockApi(page);
  await page.goto('/tests/realtime/index.html');
  await expect(page.getByRole('status', { name: 'En vivo' })).toBeVisible();
  await expect.poll(() => state.pendingReads).toBeGreaterThan(1);
  state.sales = [sale];
  await page.evaluate(() => window.realtimeTest.emit('SALE'));
  await expect(page.getByText('RT-001').first()).toBeVisible();
  state.sales = [];
  await page.evaluate(() => window.realtimeTest.emit('SALE'));
  await expect(page.getByText('RT-001')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const mobile of [false, true]) test(`catalog refreshes descriptions mobile=${mobile}`, async ({ page }) => {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  const state = await mockApi(page);
  await page.goto('/tests/realtime/index.html?view=catalog');
  await expect(page.getByText('Original product').filter({ visible: true }).first()).toBeVisible();
  await expect.poll(() => state.productReads).toBeGreaterThan(1);
  state.name = 'Updated product'; state.description = 'Updated description';
  await page.evaluate(() => window.realtimeTest.emit('PRODUCT'));
  await expect(page.getByText('Updated product').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('Updated description').filter({ visible: true }).first()).toBeVisible();
});

test('burst coalesces, other entities are ignored and draft fields survive', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=probe');
  await expect(page.getByRole('status', { name: 'En vivo' })).toBeVisible();
  await expect(page.getByLabel('reads')).toHaveText('1');
  await page.getByLabel('draft').fill('My unsaved price');
  await page.evaluate(() => { window.realtimeTest.emit('PRODUCT', 20); window.realtimeTest.emit('STOCK', 5); });
  await expect(page.getByLabel('reads')).toHaveText('2');
  await page.waitForTimeout(600);
  await expect(page.getByLabel('reads')).toHaveText('2');
  await expect(page.getByLabel('draft')).toHaveValue('My unsaved price');
  expect(await page.evaluate(() => window.realtimeTest.parser())).toBe(true);
});

test('disconnect recovers changes missed while offline', async ({ page }) => {
  const state = await mockApi(page); await page.goto('/tests/realtime/index.html');
  await expect.poll(() => state.pendingReads).toBeGreaterThan(1);
  state.sales = [sale];
  await page.evaluate(() => window.realtimeTest.close());
  await expect(page.getByText('RT-001').first()).toBeVisible();
  expect(await page.evaluate(() => window.realtimeTest.connections)).toBe(2);
});

test('resume refreshes after mobile suspension and keeps one stream', async ({ page }) => {
  const state = await mockApi(page); await page.goto('/tests/realtime/index.html');
  await expect.poll(() => state.pendingReads).toBeGreaterThan(1);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  state.sales = [sale];
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('RT-001').first()).toBeVisible();
  expect(await page.evaluate(() => window.realtimeTest.connections)).toBe(2);
});

test('Bearer is sent only in the header and logout closes the stream', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=probe');
  await expect(page.getByRole('status', { name: 'En vivo' })).toBeVisible();
  const requests = await page.evaluate(() => window.realtimeTest.requests);
  expect(requests[0].authorization).toBe('Bearer test-bearer-secret');
  expect(requests[0].url).not.toContain('test-bearer-secret');
  await page.evaluate(() => window.realtimeTest.logout());
  await expect(page.getByRole('status', { name: /En vivo|Reconectando|Sin conexión/ })).toHaveCount(0);
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => window.realtimeTest.connections)).toBe(1);
});

test('no business read permissions still allows security notices without business refresh', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=denied');
  await expect(page.getByLabel('reads')).toHaveText('0');
  expect(await page.evaluate(() => window.realtimeTest.connections)).toBe(1);
});

for (const status of [401, 403]) test(`HTTP ${status} stops retries with the correct session behavior`, async ({ page }) => {
  await mockApi(page); await page.goto(`/tests/realtime/index.html?view=probe&streamStatus=${status}`);
  await expect.poll(() => page.evaluate(() => window.realtimeTest.connections)).toBe(1);
  if (status === 401) await expect.poll(() => page.evaluate(() => window.realtimeTest.token())).toBe(null);
  else expect(await page.evaluate(() => window.realtimeTest.token())).toBe('test-bearer-secret');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.realtimeTest.connections)).toBe(1);
});


for (const mobile of [false, true]) test(`terminal keeps its cards and focus during slow background refresh mobile=${mobile}`, async ({ page }) => {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  const state = await mockApi(page); state.sales = [sale];
  await page.goto('/tests/realtime/index.html');
  await expect(page.getByText('RT-001').first()).toBeVisible();
  await expect.poll(() => state.pendingReads).toBeGreaterThan(1);
  const card = await page.locator('.realtime-sale-enter').first().elementHandle();
  const pay = page.getByRole('button', { name: 'Cobrar Venta' }).first();
  await pay.focus();
  await expect(pay).toBeFocused();
  const reads = state.pendingReads;
  state.delay = 900;
  state.sales = [{ ...sale, totalAmount: 12 }, { ...sale, id: 'sale-new', saleNumber: 'RT-002' }];
  await page.evaluate(() => window.realtimeTest.emit('SALE'));
  await expect.poll(() => state.pendingReads).toBeGreaterThan(reads);
  expect(await card.evaluate(element => element.isConnected)).toBe(true);
  await expect(pay).toBeFocused();
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
  await expect(page.getByText('RT-002').first()).toBeVisible();
  expect(await card.evaluate(element => element.isConnected)).toBe(true);
  await expect(pay).toBeFocused();
});

for (const mobile of [false, true]) test(`catalog keeps its existing rows during slow refresh mobile=${mobile}`, async ({ page }) => {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  const state = await mockApi(page);
  await page.goto('/tests/realtime/index.html?view=catalog');
  await expect(page.getByText('Original product').filter({ visible: true }).first()).toBeVisible();
  await expect.poll(() => state.productReads).toBeGreaterThan(1);
  const item = mobile ? page.locator('article').first() : page.getByRole('row').filter({ hasText: 'Original product' });
  const node = await item.elementHandle();
  const reads = state.productReads;
  state.delay = 900; state.name = 'Updated product';
  await page.evaluate(() => window.realtimeTest.emit('PRODUCT'));
  await expect.poll(() => state.productReads).toBeGreaterThan(reads);
  await expect(page.getByText('Original product').filter({ visible: true }).first()).toBeVisible();
  expect(await node.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.getByText('Updated product').filter({ visible: true }).first()).toBeVisible();
  expect(await node.evaluate(element => element.isConnected)).toBe(true);
});

test('returning to the tab refreshes without replacing visible cards', async ({ page }) => {
  const state = await mockApi(page); state.sales = [sale];
  await page.goto('/tests/realtime/index.html');
  await expect(page.getByText('RT-001').first()).toBeVisible();
  await expect.poll(() => state.pendingReads).toBeGreaterThan(1);
  const card = await page.locator('.realtime-sale-enter').first().elementHandle();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  state.delay = 900; const reads = state.pendingReads;
  state.sales = [sale, { ...sale, id: 'sale-new', saleNumber: 'RT-002' }];
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => state.pendingReads).toBeGreaterThan(reads);
  expect(await card.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
  await expect(page.getByText('RT-002').first()).toBeVisible();
  expect(await card.evaluate(element => element.isConnected)).toBe(true);
});

test('temporary background errors preserve the last valid terminal data', async ({ page }) => {
  const state = await mockApi(page); state.sales = [sale];
  await page.goto('/tests/realtime/index.html');
  await expect(page.getByText('RT-001').first()).toBeVisible();
  await expect.poll(() => state.pendingReads).toBeGreaterThan(1);
  const card = await page.locator('.realtime-sale-enter').first().elementHandle();
  state.status = 503; const reads = state.pendingReads;
  await page.evaluate(() => window.realtimeTest.emit('SALE'));
  await expect.poll(() => state.pendingReads).toBeGreaterThan(reads);
  await page.waitForTimeout(400);
  expect(await card.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.getByText('RT-001').first()).toBeVisible();
  await expect(page.getByText('Ocurrió un error al cargar la terminal.')).toHaveCount(0);
});


test('an open payment form preserves its amount and focus during a background event', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await mockApi(page); state.sales = [sale];
  await page.goto('/tests/realtime/index.html');
  await expect(page.getByText('RT-001').first()).toBeVisible();
  await expect.poll(() => state.pendingReads).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Cobrar Venta' }).click();
  const amount = page.getByRole('dialog').getByRole('spinbutton').first();
  await amount.fill('15');
  const node = await amount.elementHandle();
  const reads = state.pendingReads; state.delay = 900;
  await page.evaluate(() => window.realtimeTest.emit('SALE'));
  await expect.poll(() => state.pendingReads).toBeGreaterThan(reads);
  await expect(amount).toHaveValue('15');
  await expect(amount).toBeFocused();
  expect(await node.evaluate(element => element.isConnected)).toBe(true);
  await page.waitForTimeout(1000);
  await expect(amount).toHaveValue('15');
  expect(await node.evaluate(element => element.isConnected)).toBe(true);
});

for (const mobile of [false, true]) test(`shift income and expenses refresh without reload or flicker mobile=${mobile}`, async ({ page }) => {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  const state = await mockApi(page);
  await page.goto('/tests/realtime/index.html?view=shifts');
  await expect(page.getByRole('status', { name: 'En vivo' })).toBeVisible();
  await expect.poll(() => state.shiftReads).toBeGreaterThan(1);
  await expect(page.getByText('722.20', { exact: false })).toBeVisible();
  const heading = page.getByRole('heading', { name: 'Realtime register' });
  const original = await heading.elementHandle();
  state.delay = 700;
  state.inflows = 732.20;
  await page.evaluate(() => window.realtimeTest.emit('POS'));
  await expect.poll(() => state.shiftReads).toBeGreaterThan(2);
  await expect(heading).toBeVisible();
  expect(await original.evaluate(node => node.isConnected)).toBe(true);
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
  await expect(page.getByText('732.20', { exact: false })).toBeVisible();
  state.inflows = 757.20; state.outflows = 127;
  await page.evaluate(() => window.realtimeTest.emit('POS', 2));
  await expect(page.getByText('757.20', { exact: false })).toBeVisible();
  await expect(page.getByText('127.00', { exact: false })).toBeVisible();
  expect(await original.evaluate(node => node.isConnected)).toBe(true);
});

for (const code of ['resource_already_exists', 'data_integrity_violation']) test(`cash register only reports a duplicate name for the domain conflict ${code}`, async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/tenant/branches?**', route => route.fulfill({ json: { content: [{ id: 'branch', name: 'Main branch' }] } }));
  await page.route('**/api/tenant/cash-registers', route => route.fulfill({ status: 409, json: { code, message: 'No se pudo guardar el registro.' } }));
  await page.goto('/tests/realtime/index.html?view=register');
  await page.getByPlaceholder('Ej: Caja Principal 01').fill('New cash register');
  await page.getByRole('combobox').selectOption('branch');
  await page.getByRole('button', { name: 'Guardar' }).click();
  if (code === 'resource_already_exists') await expect(page.getByText('Ya existe una caja con ese nombre en la sucursal.')).toBeVisible();
  else {
    await expect(page.getByText('No se pudo guardar el registro.')).toBeVisible();
    await expect(page.getByText('Ya existe una caja con ese nombre en la sucursal.')).toHaveCount(0);
  }
});

test('a personal security notice clears the token and explains reauthentication', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=probe');
  await expect(page.getByRole('status', { name: 'En vivo' })).toBeVisible();
  await page.evaluate(() => window.realtimeTest.raw('event: session-revoked\ndata: {"code":"session_permissions_changed"}\n\n'));
  await expect.poll(() => page.evaluate(() => window.realtimeTest.token())).toBeNull();
  await expect(page.getByText('Tus permisos cambiaron. Inicia sesión nuevamente.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Iniciar Sesión/i })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.realtimeTest.connections)).toBe(1);
  await page.reload();
  // El aviso sobrevive al cambio de ruta o a una recarga, aunque el arnés recrea la sesión de prueba.
  expect(await page.evaluate(() => sessionStorage.getItem('sessionNotice'))).toBe('Tus permisos cambiaron. Inicia sesión nuevamente.');
});

test('HTTP 401 from the stream retains the security reason and stops reconnecting', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=probe&streamStatus=401&streamCode=session_permissions_changed');
  await expect.poll(() => page.evaluate(() => window.realtimeTest.token())).toBeNull();
  await expect(page.getByText('Tus permisos cambiaron. Inicia sesión nuevamente.')).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.realtimeTest.connections)).toBe(1);
});

test('a REST rejection revokes the session even without receiving an SSE notice', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=register');
  await page.route('**/api/tenant/branches?**', route => route.fulfill({ json: { content: [{ id: 'branch', name: 'Main branch' }] } }));
  await page.route('**/api/tenant/cash-registers', route => route.fulfill({ status: 401, json: { code: 'session_permissions_changed' } }));
  await page.reload();
  await page.getByPlaceholder('Ej: Caja Principal 01').fill('Cash register');
  await page.getByRole('combobox').selectOption('branch');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect.poll(() => page.evaluate(() => window.realtimeTest.token())).toBeNull();
  await expect(page.getByText('Tus permisos cambiaron. Inicia sesión nuevamente.')).toBeVisible();
});

test('a late REST 401 from an old token does not close the new session', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/tenant/branches?**', route => route.fulfill({ json: { content: [{ id: 'branch', name: 'Main branch' }] } }));
  let release;
  let received = false;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/api/tenant/cash-registers', async route => {
    received = true; await held;
    await route.fulfill({ status: 401, json: { code: 'session_permissions_changed' } });
  });
  await page.goto('/tests/realtime/index.html?view=register');
  await page.getByPlaceholder('Ej: Caja Principal 01').fill('Cash register');
  await page.getByRole('combobox').selectOption('branch');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect.poll(() => received).toBe(true);
  await page.evaluate(() => window.realtimeTest.replaceToken('new-session-token'));
  release();
  await expect(page.getByText('No se pudo guardar la caja.')).toBeVisible();
  expect(await page.evaluate(() => window.realtimeTest.token())).toBe('new-session-token');
  await expect(page.getByText('Tus permisos cambiaron. Inicia sesión nuevamente.')).toHaveCount(0);
});

test('security logout propagates to another tab', async ({ page, context }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=probe');
  await page.evaluate(() => localStorage.setItem('token', 'test-bearer-secret'));
  const second = await context.newPage();
  try {
    await mockApi(second); await second.goto('/tests/realtime/index.html?view=probe');
    await expect(second.getByRole('status', { name: 'En vivo' })).toBeVisible();
    await page.evaluate(() => window.realtimeTest.raw('event: session-revoked\ndata: {"code":"session_permissions_changed"}\n\n'));
    await expect.poll(() => second.evaluate(() => window.realtimeTest.token())).toBeNull();
    await expect(second.getByText('Tus permisos cambiaron. Inicia sesión nuevamente.')).toBeVisible();
  } finally { await second.close(); }
});

test('a late cross-tab logout cannot remove a newly persisted token', async ({ page }) => {
  await mockApi(page); await page.goto('/tests/realtime/index.html?view=probe');
  await page.evaluate(() => {
    localStorage.setItem('token', 'new-session-in-another-tab');
    window.dispatchEvent(new StorageEvent('storage', { key: 'token', oldValue: 'test-bearer-secret', newValue: null }));
  });
  await expect.poll(() => page.evaluate(() => window.realtimeTest.token())).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('new-session-in-another-tab');
});

test('a late profile response cannot restore a session after logout', async ({ page }) => {
  await mockApi(page);
  let received = false;
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/api/auth/profile', async route => {
    received = true; await held;
    await route.fulfill({ json: { id: 'old-session-profile' } });
  });
  await page.route('**/api/menus/my-tree', route => route.fulfill({ json: [] }));
  await page.goto('/tests/realtime/index.html?view=probe');
  await page.evaluate(() => { void window.realtimeTest.initialize(); });
  await expect.poll(() => received).toBe(true);
  await page.evaluate(() => window.realtimeTest.logout());
  release();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.realtimeTest.snapshot())).toEqual({ token: null, ready: false, profileId: undefined });
});
