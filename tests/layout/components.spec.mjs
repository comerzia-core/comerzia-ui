import { test, expect } from '@playwright/test';
test.beforeEach(async ({page}) => {
  await page.route('**/api/**',route => route.fulfill({json:route.request().url().endsWith('/auth/profile') ? {
    id:'owner-a',username:'ana',firstName:'Ana',fullName:'Ana Perez Rodriguez Administracion Comercial de Todas las Sucursales',roles:['OWNER'],permissions:[],theme:'light',
    companySettings:{timezone:'America/La_Paz',currencyCode:'BOB',planTypeCode:701}
  } : {}}));
  await page.goto('/tests/themes/index.html?view=layout');
});
test('context action opens a fixed viewport overlay and preserves underlying screen',async ({page}) => {
  await page.getByRole('button',{name:'Abrir opciones',exact:true}).click();
  await page.getByText('Editar producto',{exact:true}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await expect(dialog.locator('..')).toHaveCSS('position','fixed');
  const overlay=await dialog.locator('..').boundingBox();const box=await dialog.boundingBox();
  const viewport=page.viewportSize();expect(overlay.x).toBe(0);expect(overlay.y).toBe(0);
  await expect(dialog.locator('..')).toHaveCSS('inset','0px');
  expect(overlay.width).toBeLessThanOrEqual(viewport.width);expect(overlay.height).toBe(viewport.height);
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
  await page.getByRole('button',{name:'Cerrar ventana'}).click();await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel('Referencia')).toHaveValue('Venta sin guardar');
});
test('profile dropdown retains layout and options fit within viewport',async ({page}) => {
  await page.getByLabel('Opciones de perfil').click();
  const menu=page.locator('.dropdown-content');await expect(menu).toHaveCSS('position','absolute');
  await expect(menu).toHaveCSS('display','flex');
  const bounds=await menu.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(await menu.evaluate(el=>el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole('link',{name:'Mi Perfil'}).waitFor();
});
