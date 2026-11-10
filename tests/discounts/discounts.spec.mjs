import { test, expect } from '@playwright/test';

async function mockApi(page) {
  const state = { sent: null, quoteError: false, quoteDelay: 0, returnedQuantity: 0, returns: null };
  const detail = () => ({ id: 'detail', productVariantId: 'variant', productName: 'Producto prueba', variantName: 'Unidad',
    priceTypeId: 'price', receiptQuantity: 3, equivalenceFactor: 1, physicalQuantity: 3, returnedQuantity: state.returnedQuantity,
    receiptUnitPrice: 31.67, receiptSuggestedUnitPrice: 35, lineTotalSuggested: 105, lineTotalDiscount: 10, lineTotalFinal: 95 });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data = {}, status = 200;
    if (path.endsWith('/sales') && request.method() === 'POST' || path.endsWith('/sales/pending') && request.method() === 'PUT') {
      state.sent = request.postDataJSON(); data = { id: 'saved', ...state.sent };
    } else if (path.endsWith('/sales/pending/details') || path.endsWith('/sales/sale-b/details')) data = [detail()];
    else if (path.includes('/sales-catalog/variants/')) data = { variantId: 'variant', sku: 'SKU', name: 'Producto prueba', nameVariant: 'Unidad',
      availableStock: 100, activePrices: [{ id: 'active', priceTypeId: 'price', priceTypeName: 'Unidad', salePrice: 35, discountPrice: 30, equivalenceFactor: 1 }] };
    else if (path.endsWith('/sales/number/SALE-B')) data = { id: 'sale-b', saleNumber: 'SALE-B', saleStatus: 602,
      totalAmount: 95, subtotalAmount: 105, discountedAmount: 10, date: '2026-10-20T01:00:00Z' };
    else if (path.endsWith('/return-context')) data = { availableShifts: [{ id: 'shift', cashName: 'Caja B', branchName: 'Tienda B', employeeName: 'Seller' }] };
    else if (path.endsWith('/return-quote')) {
      if (state.quoteDelay) await new Promise(resolve => setTimeout(resolve, state.quoteDelay));
      const requested = request.postDataJSON().returnDetails[0];
      const amounts = [31.66, 31.67, 31.67].slice(state.returnedQuantity, state.returnedQuantity + requested.quantityToReturn);
      const totalRefund = Math.round(amounts.reduce((sum, amount) => sum + amount, 0) * 100) / 100;
      data = { details: [{ ...requested, totalRefund, subtotalRefund: requested.quantityToReturn * 35, discountRefund: requested.quantityToReturn * 35 - totalRefund }],
        totalRefund, subtotalRefund: requested.quantityToReturn * 35, discountRefund: requested.quantityToReturn * 35 - totalRefund };
      if (state.quoteError) { status = 400; data = { errorCode: 'invalid_return_quantity', message: 'Internal detail' }; }
    } else if (path.endsWith('/returns')) { state.returns = request.postDataJSON(); data = { id: 'returned' }; }
    else if (path.includes('dictionar')) data = { 'payment-type': [{ code: 701, label: 'Efectivo' }] };
    await route.fulfill({ status, json: data });
  });
  return state;
}
async function openCart(page, quantity = 1, discount = 0) {
  await page.goto('/tests/discounts/index.html');
  await expect(page.getByRole('heading', { name: 'Nueva Venta (Registro)' })).toBeVisible();
  await page.evaluate(({ quantity, discount }) => window.discountTest.seed(quantity, discount), { quantity, discount });
}

test('each scan adds one unit and increments an existing cart line once', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/tenant/sales-catalog/barcodes/CODE', route => route.fulfill({ json: {
    variantId: 'variant', sku: 'SKU', name: 'Producto prueba', nameVariant: 'Unidad', status: true,
    availableStock: 100, activePrices: [{ id: 'active', priceTypeId: 'price', priceTypeName: 'Unidad', salePrice: 35, discountPrice: 30, equivalenceFactor: 1 }],
  } }));
  await openCart(page, 2);
  const input = page.getByPlaceholder('Buscar producto por nombre o escanear...');
  await input.fill('CODE');
  await input.dispatchEvent('keydown', { key: 'Enter', repeat: true });
  expect(await page.evaluate(() => window.discountTest.snapshot().items[0].quantity)).toBe(2);
  await input.press('Enter');
  await expect.poll(() => page.evaluate(() => window.discountTest.snapshot().items[0].quantity)).toBe(3);
  await input.fill('CODE');
  await input.press('Enter');
  await expect.poll(() => page.evaluate(() => window.discountTest.snapshot().items[0].quantity)).toBe(4);
  expect(await page.evaluate(() => window.discountTest.snapshot().items.length)).toBe(1);
  await page.evaluate(() => window.discountTest.quantity(0));
  await input.fill('CODE');
  await input.press('Enter');
  await expect.poll(() => page.evaluate(() => window.discountTest.snapshot().items[0]?.quantity)).toBe(1);
});
async function discountInput(page) {
  await page.getByText('+ Agregar descuento', { exact: true }).filter({ visible: true }).click();
  return page.getByRole('textbox', { name: 'Descuento de Producto prueba' }).filter({ visible: true });
}

test('one discount stays fixed while quantity grows and submits exactly 95', async ({ page }) => {
  const state = await mockApi(page);
  await openCart(page);
  const input = await discountInput(page);
  await input.fill('5'); await input.press('Tab');
  expect(await page.evaluate(() => window.discountTest.snapshot().total)).toBe(30);
  const quantity = page.locator('input[type="number"]').filter({ visible: true });
  await quantity.fill('3'); await quantity.press('Tab');
  await expect(input).toHaveValue('5.00');
  await expect(page.getByText('Máx. BOB 15.00', { exact: true }).filter({ visible: true })).toBeVisible();
  expect(await page.evaluate(() => window.discountTest.snapshot().total)).toBe(100);
  await input.fill('10'); await input.press('Tab');
  await expect(input).toHaveValue('10.00');
  expect(await page.evaluate(() => window.discountTest.snapshot().total)).toBe(95);
  await expect(page.getByText('Por Unidad', { exact: true })).toHaveCount(0);
  await expect(page.getByText('X Unid.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enviar a Caja', exact: true }).click();
  await expect.poll(() => state.sent).toMatchObject({ expectedTotalAmount: 95,
    details: [{ receiptQuantity: 3, lineTotalDiscount: 10 }] });
  expect(state.sent.details[0]).not.toHaveProperty('lineDiscountAmount');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('typing a discount updates total and discounts in real time without blur or enter', async ({ page }) => {
  await mockApi(page);
  await openCart(page);
  const input = await discountInput(page);
  // Type '3' without pressing Tab or Enter
  await input.pressSequentially('3');
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 3, total: 32 });
  // Type '.5' without blur
  await input.pressSequentially('.5');
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 3.5, total: 31.5 });
  // Clear input
  await input.fill('');
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 0, total: 35 });
});

test('adding another unit preserves the offered discount and invalid reductions keep the cart', async ({ page }) => {
  await mockApi(page); await openCart(page, 1, 5);
  await page.evaluate(() => window.discountTest.addOne());
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 5, total: 65 });
  await page.evaluate(() => { window.discountTest.quantity(3); window.discountTest.discount(10); });
  expect(await page.evaluate(() => window.discountTest.quantity(1))).toMatchObject({ success: false });
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 10, total: 95, items: [{ quantity: 3 }] });
});

test('clicking send commits and clamps the visible discount before building the request', async ({ page }) => {
  const state = await mockApi(page); await openCart(page, 3);
  const input = await discountInput(page);
  await input.fill('15.01');
  await page.getByRole('button', { name: 'Enviar a Caja', exact: true }).click();
  await expect.poll(() => state.sent?.expectedTotalAmount).toBe(90);
  expect(state.sent.details[0].lineTotalDiscount).toBe(15);
});

test('discounts and quantities affect only the selected presentation of a product', async ({ page }) => {
  await mockApi(page); await openCart(page, 3);
  await page.evaluate(() => window.discountTest.addPresentation());
  const addDiscount = page.getByText('+ Agregar descuento', { exact: true }).filter({ visible: true });
  await addDiscount.click();
  const input = page.getByRole('textbox', { name: 'Descuento de Producto prueba' }).filter({ visible: true });
  await expect(input).toHaveCount(1);
  await input.fill('10'); await input.press('Tab');
  const quantity = page.locator('input[type="number"]').filter({ visible: true }).first();
  await quantity.fill('4'); await quantity.press('Tab');
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 15, total: 230,
    items: [{ priceTypeId: 'price', quantity: 4, lineTotalDiscount: 10 }, { priceTypeId: 'pack', quantity: 1, lineTotalDiscount: 5 }] });
});

test('invalid discounts cannot be submitted and cents remain exact', async ({ page }) => {
  const state = await mockApi(page); await openCart(page, 3);
  const input = await discountInput(page);
  await page.evaluate(() => window.discountTest.discount(20));
  await page.getByRole('button', { name: 'Enviar a Caja', exact: true }).click();
  expect(state.sent).toBeNull();
  await input.fill('0,01'); await input.press('Tab');
  expect(await page.evaluate(() => window.discountTest.snapshot().total)).toBe(104.99);
  await input.fill('10'); await input.press('Tab');
  await page.getByRole('button', { name: 'Enviar a Caja', exact: true }).click();
  await expect.poll(() => state.sent?.expectedTotalAmount).toBe(95);
});

test('discounts exceeding the maximum are automatically clamped to the allowed maximum on blur or Enter', async ({ page }) => {
  await mockApi(page); await openCart(page, 3);
  const input = await discountInput(page);

  // Exceder el máximo permitido (15.00) y salir con Tab (blur)
  await input.fill('25');
  await input.press('Tab');
  await expect(input).toHaveValue('15.00');
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 15, total: 90 });

  // Exceder el máximo permitido (15.00) y presionar Intro (Enter)
  await input.click();
  await input.fill('99.50');
  await input.press('Enter');
  await expect(input).toHaveValue('15.00');
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ discount: 15, total: 90 });
});

test('editing a pending sale preserves the exact discount total', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/tests/discounts/index.html?edit=1');
  await expect(page.getByRole('button', { name: 'Actualizar Venta', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.discountTest.snapshot().total)).toBe(95);
  await page.getByRole('button', { name: 'Actualizar Venta', exact: true }).click();
  await expect.poll(() => state.sent).toMatchObject({ expectedTotalAmount: 95, details: [{ lineTotalDiscount: 10 }] });
});

test('equivalence factors raise the limit without multiplying the offered discount', async ({ page }) => {
  await mockApi(page); await openCart(page);
  await page.evaluate(() => window.discountTest.seed(2, 10, 3));
  expect(await page.evaluate(() => window.discountTest.snapshot())).toMatchObject({ subtotal: 210, discount: 10, total: 200 });
  expect(await page.evaluate(() => window.discountTest.discount(30.01))).toMatchObject({ success: false });
  expect(await page.evaluate(() => window.discountTest.discount(30))).toMatchObject({ success: true });
});

test('return preview uses the server cent allocation and sends the displayed amount', async ({ page }) => {
  const state = await mockApi(page); state.quoteDelay = 200;
  await page.goto('/tests/discounts/index.html?path=/sales/returns/SALE-B');
  await expect(page.getByText('Caja B', { exact: true }).first()).toBeVisible();
  const quantity = page.locator('input[type="number"]').filter({ visible: true });
  await quantity.fill('1'); await quantity.press('Tab');
  await page.getByPlaceholder('Ej. Producto defectuoso, error en pedido...').fill('Prueba');
  const process = page.getByRole('button', { name: 'Procesar Devolución', exact: true });
  await expect(process).toBeEnabled();
  await process.click();
  await expect(page.getByText('BOB 31.66', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sí, Procesar', exact: true }).click();
  await expect.poll(() => state.returns?.expectedRefundAmount).toBe(31.66);
});

test('return quote failures block confirmation and hide backend details', async ({ page }) => {
  const state = await mockApi(page); state.quoteError = true;
  await page.goto('/tests/discounts/index.html?path=/sales/returns/SALE-B');
  await page.getByRole('button', { name: 'Devolver Todo', exact: true }).click();
  await page.getByPlaceholder('Ej. Producto defectuoso, error en pedido...').fill('Prueba');
  await expect(page.getByRole('alert')).toContainText('Revisa las cantidades');
  await expect(page.getByRole('button', { name: 'Procesar Devolución', exact: true })).toBeDisabled();
  await expect(page.getByText('Internal detail')).toHaveCount(0);
});
