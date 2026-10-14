import { test, expect } from '@playwright/test';

const base = '/tests/images/index.html';
async function activate(locator, mobile) {
  if (mobile) { await locator.tap(); await locator.tap(); }
  else await locator.dblclick();
}

test('URLs estables, origen exacto, versiones, firmas y carpetas conservadas', async ({ page }) => {
  await page.goto(base);
  const result = await page.evaluate(() => {
    const optimize = window.imageTest.optimize;
    const original = 'https://res.cloudinary.com/cloud/image/upload/v123/comerzia/product.jpg';
    const thumbnail = optimize(original, 'thumbnail');
    return {
      thumbnail, same: optimize(thumbnail, 'thumbnail'), full: optimize(thumbnail, 'full'),
      external: optimize('https://res.cloudinary.com.fake.test/cloud/image/upload/v123/photo.jpg'),
      signed: optimize('https://res.cloudinary.com/cloud/image/upload/s--signature--/v123/photo.jpg'),
      folder: optimize('https://res.cloudinary.com/cloud/image/upload/my_folder/photo.jpg'),
      local: optimize('blob:local'), empty: optimize(null),
    };
  });
  expect(result.thumbnail).toContain('/c_thumb,w_120,h_120,g_auto,f_auto,q_auto/v123/');
  expect(result.same).toBe(result.thumbnail);
  expect(result.full).toContain('/c_limit,w_1200,h_1200,f_auto,q_auto/v123/');
  expect(result.full).not.toContain('w_120,');
  expect(result.external).toBe('https://res.cloudinary.com.fake.test/cloud/image/upload/v123/photo.jpg');
  expect(result.signed).toContain('/upload/s--signature--/');
  expect(result.folder).toContain('/my_folder/photo.jpg');
  expect(result.local).toBe('blob:local'); expect(result.empty).toBe('');
});

test('doble activación amplía sin activar la fila; foto del personal no se amplía', async ({ page }, info) => {
  await page.goto(base);
  const image = page.getByRole('button', { name: 'Ampliar imagen: Variante 1', exact: true });
  await image.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('output')).toHaveText('0');
  await activate(image, info.project.name === 'mobile');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('img')).toBeVisible();
  const size = await page.getByRole('dialog').locator('img').boundingBox();
  expect(size.width).toBeGreaterThan(250);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await activate(page.getByTestId('profile').locator('img'), info.project.name === 'mobile');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Escape cierra solamente la foto y conserva el detalle de venta', async ({ page }, info) => {
  await page.route('**/api/shared/**', route => route.fulfill({ json: [] }));
  await page.goto(`${base}?view=sale`);
  const image = page.getByRole('button', { name: 'Ampliar imagen: Arroz · Unidad' }).filter({ visible: true });
  await activate(image, info.project.name === 'mobile');
  await expect(page.getByRole('dialog')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByText('Productos en la Venta (1)')).toBeVisible();
});

test('la búsqueda conserva la selección y la ampliación son acciones independientes', async ({ page }, info) => {
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('suggestions')
    ? [{ variantId: 'variant', label: 'Arroz Unidad', imageUrl: 'http://127.0.0.1:5189/product.svg' }]
    : { variantId: 'variant', name: 'Arroz', nameVariant: 'Unidad', availableStock: 10, activePrices: [] } }));
  await page.goto(`${base}?view=search`);
  await page.getByRole('textbox').fill('Arroz');
  const image = page.getByRole('button', { name: 'Ampliar imagen: Arroz Unidad', exact: true });
  await activate(image, info.project.name === 'mobile');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('output')).toHaveText('0');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Seleccionar Arroz Unidad', exact: true }).click();
  await expect(page.locator('output')).toHaveText('1');
});

test('el navegador comparte descargas simultáneas y reutiliza caché; una nueva URL se descarga', async ({ page, request }, info) => {
  await request.get('http://127.0.0.1:5189/reset');
  await page.goto(base);
  await expect.poll(async () => (await (await request.get('http://127.0.0.1:5189/stats')).json())['/product.svg']).toBe(1);
  await page.getByRole('button', { name: 'Repetir', exact: true }).click();
  await expect(page.getByTestId('list').locator('img')).toHaveCount(3);
  const image = page.getByRole('button', { name: 'Ampliar imagen: Variante 1', exact: true });
  await activate(image, info.project.name === 'mobile');
  await expect(page.getByRole('dialog').locator('img')).toBeVisible();
  await page.keyboard.press('Escape');
  await activate(image, info.project.name === 'mobile');
  await expect(page.getByRole('dialog').locator('img')).toBeVisible();
  await page.keyboard.press('Escape');
  expect((await (await request.get('http://127.0.0.1:5189/stats')).json())['/product.svg']).toBe(1);
  await page.getByRole('button', { name: 'Nueva versión', exact: true }).click();
  await expect.poll(async () => (await (await request.get('http://127.0.0.1:5189/stats')).json())['/version2.svg']).toBe(1);
});

test('la compresión comparte trabajo y no recomprime su resultado', async ({ page }) => {
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 1200;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 2400, 1200);
    gradient.addColorStop(0, 'red'); gradient.addColorStop(1, 'blue');
    context.fillStyle = gradient; context.fillRect(0, 0, 2400, 1200);
    const originalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([originalBlob], 'product.png', { type: 'image/png' });
    let decodes = 0;
    const originalDecode = window.createImageBitmap.bind(window);
    window.createImageBitmap = (...args) => { decodes++; return originalDecode(...args); };
    const [first, second] = await Promise.all([window.imageTest.compress(file), window.imageTest.compress(file)]);
    const third = await window.imageTest.compress(first);
    window.createImageBitmap = originalDecode;
    const decoded = await originalDecode(first);
    const result = { decodes, same: first === second && first === third, size: first.size,
      originalSize: file.size, width: decoded.width, height: decoded.height, type: first.type };
    decoded.close(); return result;
  });
  expect(result.decodes).toBe(1); expect(result.same).toBe(true);
  expect(result.width).toBe(1600); expect(result.height).toBe(800);
  expect(result.size).toBeLessThan(result.originalSize); expect(result.type).toBe('image/webp');
});

test('un gesto de desplazamiento no abre el visor y el teclado sí lo abre', async ({ page }) => {
  await page.goto(base);
  const image = page.getByRole('button', { name: 'Ampliar imagen: Variante 1', exact: true });
  for (let i = 0; i < 2; i++) {
    await image.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 10 });
    await image.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 50 });
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await image.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('las imágenes ausentes o rotas presentan un fallback sin abrir el visor', async ({ page }) => {
  await page.goto(base);
  await expect(page.getByTestId('missing').locator('img')).toHaveCount(0);
  await expect(page.getByTestId('missing').getByRole('button')).toHaveCount(0);
  await page.getByTestId('missing').dblclick();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('un navegador sin codificación WebP conserva transparencia y extensión PNG', async ({ page }) => {
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 2000; canvas.height = 1000;
    const context = canvas.getContext('2d'); context.fillStyle = 'red'; context.fillRect(100, 100, 500, 500);
    const input = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
      if (type === 'image/webp') callback(null);
      else originalToBlob.call(this, callback, type, quality);
    };
    const output = await window.imageTest.compress(new File([input], 'logo.png', { type: 'image/png' }));
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    const bitmap = await createImageBitmap(output);
    context.clearRect(0, 0, 2000, 1000); context.drawImage(bitmap, 0, 0);
    const alpha = context.getImageData(0, 0, 1, 1).data[3]; bitmap.close();
    return { name: output.name, type: output.type, alpha };
  });
  expect(result.name).toBe('logo.png'); expect(result.type).toBe('image/png'); expect(result.alpha).toBe(0);
});

test('se puede ampliar la foto en formularios de variantes sin modificarla ni ampliar perfiles', async ({ page }, info) => {
  await page.goto(`${base}?view=uploader`);
  const image = page.getByRole('button', { name: 'Ampliar imagen: Foto variante', exact: true });
  await activate(image, info.project.name === 'mobile');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Cerrar ventana' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('output')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Ampliar imagen: Perfil', exact: true })).toHaveCount(0);
});
