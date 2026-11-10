import { test, expect } from '@playwright/test';

const metadata = { slug: 'tienda-demo', canonicalSlug: 'tienda-demo', title: 'Casa Origen', description: 'Objetos y sabores que hacen tu día.', template: 'STUDIO', theme: 'light',
  whatsapp: '59170000000', currency: 'BOB', logoUrl: null, paymentQrUrl: null,
  facets: { categories: [{ id: 'cat1', name: 'Bebidas', parentId: null }, { id: 'cat2', name: 'Hogar', parentId: null }],
    segments: [{ id: 'seg1', name: 'Cafés', parentId: 'cat1' }, { id: 'seg2', name: 'Objetos', parentId: 'cat2' }], brands: [{ id: 'br1', name: 'Origen', parentId: 'seg1' }] } };
const cards = Array.from({ length: 8 }, (_, index) => ({ id: 'prod' + (index + 1), name: ['Café de altura', 'Taza de cerámica', 'Café del valle', 'Vaso de vidrio', 'Cacao de origen', 'Taza pequeña', 'Infusión natural', 'Café en grano'][index], brand: 'Origen', imageUrl: null, fromPrice: 35 + index * 5, variantCount: index === 0 ? 2 : 1 }));
const detail = { id: 'prod1', name: 'Café de altura', brand: 'Origen', description: 'Un café para disfrutar despacio.', variants: [
  { id: 'var1', name: 'Molido', description: 'Tueste medio.', imageUrl: 'https://res.cloudinary.com/test-cloud/image/upload/v123/product.webp', prices: [{ id: 'price1', name: 'Unidad', equivalenceFactor: 1, salePrice: 35 }, { id: 'price2', name: 'Caja', equivalenceFactor: 6, salePrice: 180 }] },
  { id: 'var2', name: 'En grano', description: '', imageUrl: null, prices: [{ id: 'price1', name: 'Unidad', equivalenceFactor: 1, salePrice: 40 }] },
] };
async function mock(page, overrides = {}) {
  const calls = [];
  await page.route('https://res.cloudinary.com/test-cloud/image/upload/**', route => route.fulfill({
    contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="blue"/></svg>',
  }));
  await page.route('**/api/public/platform/config', route => route.fulfill({ json: {
    platformMode: 'PUBLIC', brandName: 'Fixture ERP', publicCatalogsEnabled: true,
    publicLandingEnabled: true, publicRegistrationEnabled: false,
  } }));
  await page.route('**/api/public/catalogs/**', async route => {
    const request = route.request(), url = new URL(request.url());
    expect(request.headers().authorization).toBeUndefined();
    calls.push({ path: url.pathname, params: Object.fromEntries(url.searchParams), body: request.method() === 'POST' ? request.postDataJSON() : null });
    if (overrides.unavailable) return route.fulfill({ status: 404, json: { code: 'catalog_unavailable' } });
    if (url.pathname.endsWith('/checkout')) {
      const body = request.postDataJSON();
      const lines = body.items.map(item => ({ ...item, name: 'Café de altura · Molido', presentation: item.priceTypeId === 'price2' ? 'Caja' : 'Unidad', unitPrice: item.priceTypeId === 'price2' ? 180 : 36, total: (item.priceTypeId === 'price2' ? 180 : 36) * item.quantity }));
      return route.fulfill({ json: { items: lines, total: lines.reduce((sum, line) => sum + line.total, 0), currency: 'BOB', whatsapp: '59170000000', paymentQrUrl: null, message: 'Hola, confirmo mi pedido de Café de altura. Total estimado actualizado.' } });
    }
    if (url.pathname.endsWith('/products/prod1')) return route.fulfill({ json: detail });
    if (url.pathname.endsWith('/products')) {
      const filtered = cards.filter(item => !url.searchParams.get('q') || item.name.toLowerCase().includes(url.searchParams.get('q').toLowerCase()));
      return route.fulfill({ json: { content: filtered, number: 0, size: 24, totalPages: 1, totalElements: filtered.length } });
    }
    return route.fulfill({ json: { ...metadata, ...overrides } });
  });
  return calls;
}

test('public catalog loads independently of ERP session, filters cascade and remains responsive', async ({ page }, info) => {
  await page.addInitScript(() => { localStorage.setItem('token', 'expired-private-token'); localStorage.setItem('theme', 'cupcake'); });
  const calls = await mock(page);
  await page.goto('/c/tienda-demo'); await expect(page.getByRole('heading', { name: 'Casa Origen.' })).toBeVisible();
  await expect(page.locator('.store-product-card')).toHaveCount(8);
  const photo = await page.locator('.store-product-photo').first().boundingBox();
  expect(photo.width / photo.height).toBeCloseTo(3 / 4, 2);
  await page.getByRole('button', { name: 'Bebidas', exact: true }).click();
  await page.getByRole('button', { name: 'Cafés', exact: true }).click();
  await expect.poll(() => calls.some(call => call.params.category === 'cat1' && call.params.segment === 'seg1')).toBeTruthy();
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Origen', exact: true }).click();
  await page.getByRole('button', { name: 'Mayor precio', exact: true }).click();
  await page.getByRole('button', { name: 'Ver productos', exact: true }).click();
  await expect.poll(() => calls.some(call => call.params.brand === 'br1' && call.params.order === 'price-desc')).toBeTruthy();
  await page.getByRole('button', { name: 'Hogar', exact: true }).click();
  await expect.poll(() => calls.filter(call => call.path.endsWith('/products')).at(-1).params.brand).toBeUndefined();
  await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('Café'); await expect(page.locator('.store-product-card')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('cupcake');
  await page.screenshot({ path: 'test-results/storefront/' + info.project.name + '-catalog.png', fullPage: true });
});

test('variant and presentation selection builds a cart and backend review drives WhatsApp checkout', async ({ page }) => {
  const calls = await mock(page); await page.goto('/c/tienda-demo');
  await page.getByRole('button', { name: 'Ver Café de altura', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const photo = page.locator('.store-detail-image img');
  await expect(photo).toBeVisible();
  await expect(photo).toHaveCSS('object-fit', 'cover');
  await expect(photo).toHaveAttribute('srcset', /w_300,h_400.*300w.*w_600,h_800.*600w.*w_900,h_1200.*900w/);
  const frame = await page.locator('.store-detail-image').boundingBox();
  const photoBounds = await photo.boundingBox();
  expect(photoBounds.width).toBeCloseTo(frame.width, 0);
  expect(photoBounds.height).toBeCloseTo(frame.height, 0);

  await page.getByRole('button', { name: /^Caja/ }).click();
  await page.getByRole('button', { name: 'Aumentar cantidad', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('Agregado a tu pedido', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Ver pedido, 2 unidades' }).click();
  await expect(page.getByRole('dialog')).toContainText('Caja');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Finaliza con la tienda' })).toBeVisible();
  const checkout = calls.find(call => call.path.endsWith('/checkout'));
  expect(checkout.body).toEqual({ items: [{ variantId: 'var1', priceTypeId: 'price2', quantity: 2 }] });
  await expect(page.getByRole('link', { name: 'Enviar pedido por WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa.me\/59170000000\?text=/);
  await expect(page.getByRole('dialog')).toContainText('Confirma disponibilidad y pago');
});

test('cart survives reload within a store without leaking into another store', async ({ page }) => {
  await mock(page); await page.goto('/c/tienda-demo');
  await page.getByRole('button', { name: 'Ver Café de altura', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.reload(); await expect(page.getByRole('button', { name: 'Ver pedido, 1 unidades' })).toBeVisible();
  await page.route('**/api/public/catalogs/otra-tienda', route => route.fulfill({ json: { ...metadata, slug: 'otra-tienda', canonicalSlug: 'otra-tienda' } }));
  await page.goto('/c/otra-tienda'); await expect(page.getByRole('button', { name: 'Ver pedido, 0 unidades' })).toBeVisible();
});

for (const template of ['STUDIO', 'BOUTIQUE', 'MENU']) test('template ' + template + ' supports dark mode without overflow', async ({ page }, info) => {
  await mock(page, { template, theme: 'dark' }); await page.goto('/c/tienda-demo');
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  await expect(page.locator('.storefront')).toHaveAttribute('data-store-theme', 'dark');
  await page.reload();
  await expect(page.locator('.storefront')).toHaveAttribute('data-store-theme', 'dark');
  await expect(page.locator('.store-product-card')).toHaveCount(8);
  const photo = await page.locator('.store-product-photo').first().boundingBox();
  expect(photo.width / photo.height).toBeCloseTo(3 / 4, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await page.screenshot({ path: 'test-results/storefront/' + info.project.name + '-' + template + '-dark.png', fullPage: true });
});

test('unavailable catalog displays a neutral state without private account details', async ({ page }) => {
  await mock(page, { unavailable: true }); await page.goto('/c/tienda-demo');
  await expect(page.getByRole('alert')).toHaveText('Este catálogo no está disponible.');
  await expect(page.locator('.store-product-card')).toHaveCount(0);
});
