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


test('product photos crop horizontal, vertical and square sources and allow cancellation', async ({ page }, info) => {
  await page.goto(`${base}?view=crop`);
  const input = page.locator('input[type=file]').first();
  let changes = 0;
  for (const [width, height] of [[1600, 900], [900, 1600], [1200, 1200]]) {
    const data = await page.evaluate(([width, height]) => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      context.fillStyle = 'red'; context.fillRect(0, 0, width, height);
      context.fillStyle = 'blue'; context.fillRect(width / 2, 0, width / 2, height);
      return canvas.toDataURL('image/png').split(',')[1];
    }, [width, height]);
    const file = { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
    await input.setInputFiles(file);
    const dialog = page.getByRole('dialog', { name: 'Encuadrar foto del producto' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Guardar foto' })).toBeEnabled();
    await expect(dialog.getByRole('img', { name: 'Foto original del producto' })).toBeVisible();
    await expect(dialog.locator('input[type=range]')).toHaveCount(0);
    await expect(dialog.getByTestId('crop-grid').locator('div')).toHaveCount(4);
    const frame = dialog.getByRole('group', { name: 'Área de recorte' });
    const initial = await frame.boundingBox();
    const handle = await dialog.getByRole('slider', { name: 'Redimensionar desde esquina inferior derecha' }).boundingBox();
    await drag(page, info.project.name, { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 },
      { x: handle.x + handle.width / 2 - initial.width * 0.45, y: handle.y + handle.height / 2 - initial.height * 0.45 });
    const smaller = await frame.boundingBox();
    expect(smaller.width).toBeLessThan(initial.width * 0.7);
    expect(smaller.width / smaller.height).toBeCloseTo(3 / 4, 2);
    const resizedHandle = await dialog.getByRole('slider', { name: 'Redimensionar desde esquina inferior derecha' }).boundingBox();
    await drag(page, info.project.name, { x: resizedHandle.x + 16, y: resizedHandle.y + 16 },
      { x: resizedHandle.x + 16 + initial.width * 0.15, y: resizedHandle.y + 16 + initial.height * 0.15 });
    const larger = await frame.boundingBox();
    expect(larger.width).toBeGreaterThan(smaller.width);
    expect(larger.width / larger.height).toBeCloseTo(3 / 4, 2);
    const stage = await dialog.getByTestId('crop-stage').boundingBox();
    await drag(page, info.project.name, { x: larger.x + larger.width / 2, y: larger.y + larger.height / 2 },
      { x: stage.x + stage.width + 50, y: larger.y + larger.height / 2 });
    const moved = await frame.boundingBox();
    expect(moved.x).toBeGreaterThan(smaller.x);
    expect(moved.x + moved.width).toBeLessThanOrEqual(stage.x + stage.width + 1);
    expect(moved.y + moved.height).toBeLessThanOrEqual(stage.y + stage.height + 1);
    await dialog.screenshot({ path: `test-results/crop-frame-${info.project.name}.png` });
    await dialog.getByRole('button', { name: 'Guardar foto' }).click();
    await expect(page.locator('output')).toHaveText('900x1200');
    await expect(page.getByTestId('crop-changes')).toHaveText(String(++changes));
    const pixel = JSON.parse(await page.getByTestId('crop-pixel').textContent());
    expect(pixel[0]).toBeLessThan(10); expect(pixel[2]).toBeGreaterThan(245);
    expect(pixel[3]).toBe(255);
    await expect(dialog).toHaveCount(0);
    await input.setInputFiles(file);
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('output')).toHaveText('900x1200');
    await expect(page.getByTestId('crop-changes')).toHaveText(String(changes));
  }
  await input.setInputFiles({ name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('No se pudo abrir');
  await expect(page.getByRole('button', { name: 'Guardar foto' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByTestId('crop-changes')).toHaveText(String(changes));
});

async function drag(page, project, from, to) {
  if (project === 'mobile') {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
        x: from.x + (to.x - from.x) * step / 8,
        y: from.y + (to.y - from.y) * step / 8, id: 1,
      }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
  }
}
