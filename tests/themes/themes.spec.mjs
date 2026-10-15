import { test, expect } from '@playwright/test';

const base = '/tests/themes/index.html';
const profile = { id: 'owner-a', username: 'user-a', firstName: 'Ana', paternalLastName: 'Paz', maternalFirstName: null,
  fullName: 'Ana Paz', email: 'ana@example.test', imageUrl: null, roles: ['OWNER'], permissions: ['SEC_PROFILE_READ'],
  companySettings: { id: 'company', commercialName: 'Test Company', timezone: 'America/La_Paz', currencyCode: 'BOB', logoUrl: null } };
async function setup(page, options = {}) {
  const writes = [];
  let saved = options.initial ?? 'light';
  await page.route('**/api/**', async route => {
    const request = route.request();
    if (request.url().endsWith('/auth/profile')) {
      if (options.profileDelay) await options.profileDelay();
      return route.fulfill({ json: { ...profile, theme: options.profileTheme ?? saved } });
    }
    if (request.url().endsWith('/profile/theme')) {
      const body = request.postDataJSON(); writes.push({ body, authorization: request.headers().authorization });
      if (options.onWrite) return options.onWrite(route, body);
      saved = body.theme; return route.fulfill({ json: { theme: saved } });
    }
    if (request.url().endsWith('/profile')) return route.fulfill({ json: { ...profile, theme: saved, status: 'ACTIVE',
      companyName: 'Test Company', branchName: 'Central', branchId: null, paternalSurname: 'Paz', maternalSurname: null,
      documentType: null, documentNumber: null, documentExtension: null, address: null, phoneNumber: null } });
    return route.fulfill({ json: {} });
  });
  await page.goto(base + (options.query || ''));
  await expect.poll(() => page.evaluate(() => window.themeTest.snapshot().owner)).toBe('owner-a');
  return { writes, saved: () => saved };
}

test('previsualiza sin guardar por clic y al cerrar persiste solamente el último tema', async ({ page }, info) => {
  const { writes } = await setup(page);
  await page.getByLabel('Referencia').fill('Carrito conservado');
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Elige tu tema' });
  await page.getByRole('button', { name: 'Elegir Dulce pastel', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cupcake');
  await page.getByRole('button', { name: 'Elegir Café y caramelo', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
  await page.screenshot({ path: `test-results/theme-preview-${info.project.name}.png` });
  expect(writes).toHaveLength(0);
  const box = await dialog.boundingBox();
  if (info.project.name === 'mobile') expect(box.height).toBeLessThan(844 * 0.51);
  else expect(box.width).toBeLessThan(400);
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toEqual({ body: { theme: 'coffee' }, authorization: 'Bearer token-owner-a' });
  await expect(page.getByLabel('Referencia')).toHaveValue('Carrito conservado');
  await expect.poll(() => page.evaluate(() => window.themeTest.snapshot().savedTheme)).toBe('coffee');
});

test('Escape y tocar fuera guardan; cerrar sin cambios no genera escrituras', async ({ page }) => {
  const { writes } = await setup(page);
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.keyboard.press('Escape'); expect(writes).toHaveLength(0);
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Romance rosa', exact: true }).click();
  await page.mouse.click(10, 70);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].body.theme).toBe('valentine');
});

test('persistencia entre recargas y la preferencia del backend prevalece sobre la caché', async ({ page }) => {
  const { writes } = await setup(page, { initial: 'nord' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'nord');
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Medianoche', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar selector de temas', exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  await page.evaluate(() => localStorage.setItem('theme', 'cupcake'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');
});

test('un error mantiene el tema local y permite reintentar sin cerrar sesión', async ({ page }) => {
  let attempts = 0;
  await setup(page, { onWrite: (route, body) => ++attempts === 1
    ? route.fulfill({ status: 503, json: { message: 'Unavailable' } }) : route.fulfill({ json: body }) });
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Esmeralda', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.themeTest.snapshot().error)).toBeTruthy();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'emerald');
  await expect(page.getByLabel('Referencia')).toBeEnabled();
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.themeTest.snapshot().savedTheme)).toBe('emerald');
  expect(attempts).toBe(2);
});

test('serializa guardados y no permite que una respuesta anterior restaure el tema viejo', async ({ page }) => {
  let finish;
  const firstResponse = new Promise(resolve => { finish = resolve; });
  let sequence = 0;
  const { writes } = await setup(page, { onWrite: async (route, body) => {
    if (++sequence === 1) await firstResponse;
    return route.fulfill({ json: body });
  } });
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Dulce pastel', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect.poll(() => writes.length).toBe(1);
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Oro y azabache', exact: true }).click();
  await page.keyboard.press('Escape'); expect(writes).toHaveLength(1);
  finish();
  await expect.poll(() => writes.length).toBe(2);
  await expect.poll(() => page.evaluate(() => window.themeTest.snapshot().savedTheme)).toBe('luxury');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'luxury');
});

test('cambiar de usuario aísla la caché y descarta guardados de la sesión anterior', async ({ page }) => {
  let finish;
  const delayed = new Promise(resolve => { finish = resolve; });
  const { writes } = await setup(page, { onWrite: async (route, body) => { await delayed; await route.fulfill({ json: body }).catch(() => {}); } });
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Retro neón', exact: true }).click(); await page.keyboard.press('Escape');
  await expect.poll(() => writes.length).toBe(1);
  await page.evaluate(() => window.themeTest.changeUser('owner-b', 'corporate'));
  finish();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'corporate');
  expect(writes[0].authorization).toBe('Bearer token-owner-a');
  expect(await page.evaluate(() => localStorage.getItem('comerzia.theme.user.owner-b'))).toBe('corporate');
});

test('el perfil ofrece apariencia y abre la misma previsualización', async ({ page }) => {
  await setup(page, { query: '?view=profile' });
  await page.getByRole('button', { name: 'Apariencia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Apariencia', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Elegir Noche carbón', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Elige tu tema' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('todas las paletas cambian colores reales, respetan esquema y mantienen acciones críticas', async ({ page }) => {
  await setup(page);
  await page.addStyleTag({ content: '*,*::before,*::after {transition:none!important;animation:none!important}' });
  const values = await page.evaluate(async () => {
    const results = [];
    const button = Array.from(document.querySelectorAll('button')).find(node => node.textContent.includes('Acción principal'));
    const input = document.querySelector('input');
    const save = Array.from(document.querySelectorAll('button')).find(node => node.textContent.includes('Guardar'));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    const luminance = css => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = css; context.fillRect(0, 0, 1, 1);
      const rgb = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(value => value / 255)
        .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const contrast = (first, second) => {
      const a = luminance(first); const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    for (const item of window.themeTest.themes) {
      window.themeTest.changeUser('owner-a', item.id);
      await new Promise(requestAnimationFrame);
      const color = getComputedStyle(button);
      results.push({ id: item.id, expectedMode: item.mode, mode: document.documentElement.dataset.colorScheme,
        primary: color.backgroundColor, text: color.color, inputText: getComputedStyle(input).color,
        inputBackground: getComputedStyle(input).backgroundColor, save: getComputedStyle(save).backgroundColor,
        primaryContrast: contrast(color.color, color.backgroundColor),
        inputContrast: contrast(getComputedStyle(input).color, getComputedStyle(input).backgroundColor),
        alpha: getComputedStyle(document.querySelector('[data-testid="alpha-surface"]')).backgroundColor });
    }
    return results;
  });
  expect(new Set(values.map(item => item.primary)).size).toBeGreaterThanOrEqual(10);
  expect(new Set(values.map(item => item.save)).size).toBe(1);
  for (const item of values) {
    expect(item.mode).toBe(item.expectedMode);
    expect(item.text).not.toBe(item.primary); expect(item.inputText).not.toBe(item.inputBackground);
    expect(item.alpha).not.toBe('rgba(0, 0, 0, 0)');
    expect(item.primaryContrast, `${item.id}: primary text contrast`).toBeGreaterThanOrEqual(4.5);
    expect(item.inputContrast, `${item.id}: input text contrast`).toBeGreaterThanOrEqual(4.5);
  }
});

test('el arranque aplica un tema válido antes de cargar el perfil', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'coffee'));
  await page.route('**/api/**', async route => { await new Promise(resolve => setTimeout(resolve, 1500)); await route.fulfill({ json: { ...profile, theme: 'nord' } }); });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'coffee');
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'nord');
});

test('un refresco de perfil iniciado antes de la elección no sobrescribe la previsualización', async ({ page }) => {
  await setup(page);
  let finish;
  const response = new Promise(resolve => { finish = resolve; });
  let started = false;
  await page.route('**/api/auth/profile', async route => { started = true; await response; await route.fulfill({ json: { ...profile, theme: 'light' } }); });
  const refreshing = page.evaluate(() => window.themeTest.refresh());
  await expect.poll(() => started).toBe(true);
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Esmeralda', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'emerald');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.themeTest.snapshot().savedTheme)).toBe('emerald');
  finish(); await refreshing;
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'emerald');
});

test('la caché confirmada se comparte con otra pestaña de la misma cuenta sin enviar otro PATCH', async ({ page, context }) => {
  const first = await setup(page);
  const second = await context.newPage();
  const other = await setup(second);
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Esmeralda', exact: true }).click();
  await expect(second.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.keyboard.press('Escape');
  await expect(second.locator('html')).toHaveAttribute('data-theme', 'emerald');
  expect(first.writes).toHaveLength(1); expect(other.writes).toHaveLength(0);
  await second.close();
});

test('el cambio sigue funcionando cuando el navegador bloquea la caché de apariencia', async ({ page }) => {
  await page.addInitScript(() => {
    const read = Storage.prototype.getItem; const write = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key) { if (key === 'theme' || key.startsWith('comerzia.theme.')) throw new DOMException('Restricted'); return read.call(this, key); };
    Storage.prototype.setItem = function(key, value) { if (key === 'theme' || key.startsWith('comerzia.theme.')) throw new DOMException('Restricted'); return write.call(this, key, value); };
  });
  const { writes } = await setup(page, { initial: 'dracula' });
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Nieve ártica', exact: true }).click(); await page.keyboard.press('Escape');
  await expect.poll(() => writes.length).toBe(1); expect(writes[0].body.theme).toBe('nord');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'nord');
});

test('una caché corrupta no puede activar temas arbitrarios', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', '__proto__'));
  let finish;
  const profileReady = new Promise(resolve => { finish = resolve; });
  await page.route('**/api/**', async route => {
    await profileReady;
    await route.fulfill({ json: { ...profile, theme: 'coffee' } });
  });
  await page.goto(base);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  finish();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'coffee');
});

test('un fallo del guardado anterior no impide guardar una selección posterior ya confirmada', async ({ page }) => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  let sequence = 0;
  const { writes } = await setup(page, { onWrite: async (route, body) => {
    if (++sequence === 1) { await pending; return route.fulfill({ status: 503, json: {} }); }
    return route.fulfill({ json: body });
  } });
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Dulce pastel', exact: true }).click(); await page.keyboard.press('Escape');
  await expect.poll(() => writes.length).toBe(1);
  await page.getByRole('button', { name: 'Elegir tema', exact: true }).click();
  await page.getByRole('button', { name: 'Elegir Romance rosa', exact: true }).click(); await page.keyboard.press('Escape');
  finish();
  await expect.poll(() => page.evaluate(() => window.themeTest.snapshot().savedTheme)).toBe('valentine');
  expect(writes).toHaveLength(2);
  expect(await page.evaluate(() => window.themeTest.snapshot().error)).toBeNull();
});
