import { test, expect } from '@playwright/test';

const permissions = ['ORG_COMPANIES_READ', 'ORG_SETTINGS_MANAGE', 'ORG_PUBLIC_CATALOG_READ', 'ORG_PUBLIC_CATALOG_MANAGE', 'ORG_PUBLIC_CATALOG_PUBLISH'];
async function setup(page, allowedPermissions = permissions, eligible = true, target = '/organization/public-catalog') {
  const calls = [];
  const draft = { revision: 0, slug: 'mi-tienda', title: 'Mi tienda', description: '', template: 'STUDIO', whatsappCountry: 'BO', whatsapp: '70000000', showPaymentQr: false };
  const state = { eligible, published: false, publicUrl: null, draft, templates: [{ code: 'STUDIO', label: 'Estudio', description: 'Limpio y esencial' }, { code: 'BOUTIQUE', label: 'Boutique', description: 'Imágenes protagonistas' }] };
  const variants = [{ id: 'VariantOpaque', productName: 'Café', name: 'Molido', imageUrl: null, visible: false, active: true }, { id: 'SecondOpaque', productName: 'Café', name: 'Grano', imageUrl: null, visible: false, active: true }];
  const summary = () => { const visible = variants.filter(item => item.visible).length; return { total: 2, visible, enabled: visible === 0 ? false : visible === 2 ? true : null }; };
  await page.addInitScript(() => localStorage.setItem('token', 'admin-test-session'));
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    if (path.endsWith('/realtime/stream')) return route.abort();
    if (path.endsWith('/auth/profile')) return route.fulfill({ json: { id: 'OwnerOpaque', username: 'ana', fullName: 'Ana Pérez', firstName: 'Ana', roles: ['OWNER'], permissions: allowedPermissions,
      theme: 'light', operational: true, companySettings: { id: 'CompanyOpaque', commercialName: 'Mi tienda', currencyCode: 'BOB', timezone: 'America/La_Paz', planTypeCode: eligible ? 702 : 701 } } });
    if (path.endsWith('/menus/my-tree')) return route.fulfill({ json: [{ id: 'org', name: 'Organización', route: '/organization', children: [{ id: 'cat', name: 'Catálogo público', route: '/organization/public-catalog' }] }] });
    if (path.endsWith('/tenant/company/profile')) return route.fulfill({ json: { commercialName: 'Mi tienda', legalName: null, taxId: null, slug: 'internal-reference', companyLogoUrl: null, ticketLogoUrl: null, companyQrUrl: null, currencyCode: 'BOB', timezone: 'America/La_Paz', taxName: 'IVA', taxPercentage: 0, ticketFooterText: '', defaultMinStock: 5, defaultIdealStock: 20,
      currentSubscription: { planTypeCode: eligible ? 702 : 701, planName: eligible ? 'Inicial' : 'Free', statusName: 'Active', validUntil: '2030-01-01T00:00:00Z', maxBranches: 1, maxUsers: 3, maxProducts: 500 } } });
    if (path.endsWith('/public-catalog/access')) return route.fulfill({ json: { eligible } });
    if (path.endsWith('/public-catalog/phone-countries')) return route.fulfill({ json: [{ code: 'BO', name: 'Bolivia', callingCode: '591', suggestedTimezone: 'America/La_Paz' }] });
    if (path.endsWith('/public-catalog/facets')) return route.fulfill({ json: { categories: [{ id: 'CategoryOpaque', name: 'Bebidas', parentId: null }], segments: [{ id: 'SegmentOpaque', name: 'Cafés', parentId: 'CategoryOpaque' }], brands: [{ id: 'BrandOpaque', name: 'Origen', parentId: 'SegmentOpaque' }] } });
    if (path.endsWith('/public-catalog/selection-visibility')) return route.fulfill({ json: { category: summary(), segment: summary(), brand: summary() } });
    if (path.endsWith('/public-catalog/products')) return route.fulfill({ json: { content: [{ id: 'ProductOpaque', name: 'Café', brand: 'Origen', imageUrl: null, variantCount: 2, visibleVariantCount: summary().visible, visible: summary().enabled }], totalElements: 1, totalPages: 1, number: 0, size: 10 } });
    if (path.endsWith('/products/ProductOpaque/variants')) return route.fulfill({ json: { content: variants, totalElements: 2, totalPages: 1, number: 0, size: 10 } });
    if (path.endsWith('/public-catalog/visibility')) { const body=request.postDataJSON(); calls.push({ action: 'variant', body }); variants.filter(item=>body.variantIds.includes(item.id)).forEach(item=>item.visible=body.visible); return route.fulfill({ status: 200, body: '' }); }
    if (path.endsWith('/products/ProductOpaque/visibility') || path.endsWith('/scope-visibility')) { const body=request.postDataJSON(); calls.push({ action: path.endsWith('/scope-visibility') ? 'scope' : 'product', body }); variants.forEach(item=>item.visible=body.visible); return route.fulfill({ status: 200, body: '' }); }
    if (path.endsWith('/public-catalog/publish')) { calls.push({ action: 'publish', body: request.postDataJSON() }); state.published = true; state.publicUrl = 'https://shop.example.test/c/' + state.draft.slug; state.draft = { ...state.draft, revision: state.draft.revision + 1 }; return route.fulfill({ json: state }); }
    if (path.endsWith('/public-catalog')) {
      if (request.method() === 'PUT') { calls.push({ action: 'save', body: request.postDataJSON() }); state.draft = { ...request.postDataJSON(), revision: state.draft.revision + 1 }; }
      return route.fulfill({ json: state });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto(target);
  return calls;
}

test('owner configures country, customizes variants and confirms publication', async ({ page }, info) => {
  const calls = await setup(page);
  const section = page.getByRole('region', { name: 'Catálogo público', exact: true });
  await section.getByLabel('Nombre público', { exact: true }).fill('Mi escaparate');
  await expect(section.getByLabel('País de WhatsApp')).toHaveValue('BO');
  await page.screenshot({ path: 'test-results/storefront/' + info.project.name + '-administration.png', fullPage: true });
  await section.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await expect(section.getByText('Borrador guardado.', { exact: true })).toBeVisible();
  await page.getByRole('switch', { name: 'Publicar Café', exact: true }).click();
  await expect.poll(() => calls.some(call => call.action === 'product' && call.body.visible)).toBeTruthy();
  if(info.project.name === 'mobile') await page.locator('article').filter({ hasText: 'Café' }).click();
  else await page.getByRole('row').filter({ hasText: 'Café' }).click({ button: 'right' });
  await page.getByRole('button', { name: 'Personalizar variantes', exact: true }).click();
  await page.getByRole('switch', { name: 'Publicar variante Molido' }).click();
  await expect.poll(() => calls.some(call => call.action === 'variant')).toBeTruthy();
  await page.getByRole('button', { name: 'Cerrar ventana', exact: true }).click();
  await expect(page.getByText('Personalizado', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Publicar Café', exact: true })).toHaveCount(0);
  await section.getByRole('button', { name: 'Publicar catálogo', exact: true }).click();
  expect(calls.filter(call => call.action === 'publish')).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirmar publicación', exact: true }).click();
  await expect(section.getByRole('link', { name: 'Abrir catálogo' })).toHaveAttribute('href', 'https://shop.example.test/c/mi-tienda');
  expect(calls.find(call => call.action === 'save').body).toMatchObject({ title: 'Mi escaparate', whatsappCountry: 'BO', whatsapp: '70000000' });
  expect(calls.find(call => call.action === 'save').body.theme).toBeUndefined();
  expect(await page.locator('main').innerText()).not.toContain('VariantOpaque');
});

test('classification switches send the entire scope independently of search and pagination', async ({ page }) => {
  const calls = await setup(page);
  await page.getByLabel('Categoría', { exact: true }).selectOption('CategoryOpaque');
  await page.getByRole('switch', { name: 'Publicar grupo categoría' }).click();
  await expect.poll(() => calls.filter(call=>call.action==='scope').length).toBe(1);
  await page.getByLabel('Rubro', { exact: true }).selectOption('SegmentOpaque');
  await page.getByRole('switch', { name: 'Publicar grupo rubro' }).click();
  await page.getByLabel('Marca', { exact: true }).selectOption('BrandOpaque');
  await page.getByRole('searchbox', { name: 'Buscar productos para publicar' }).fill('Molido');
  await page.getByRole('switch', { name: 'Publicar grupo marca' }).click();
  await expect.poll(() => calls.filter(call=>call.action==='scope').length).toBe(3);
  expect(calls.filter(call=>call.action==='scope').map(call=>call.body)).toEqual([
    { level: 'CATEGORY', reference: 'CategoryOpaque', visible: true },
    { level: 'SEGMENT', reference: 'SegmentOpaque', visible: false },
    { level: 'BRAND', reference: 'BrandOpaque', visible: true },
  ]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});

test('expired or Free subscription blocks the route and hides its navigation', async ({ page }) => {
  await setup(page, permissions, false);
  await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Catálogo público', exact: true })).toHaveCount(0);
  await expect(page.locator('a[href="/organization/public-catalog"]')).toHaveCount(0);
});

test('read permission exposes no write controls on eligible subscriptions', async ({ page }) => {
  await setup(page, ['ORG_PUBLIC_CATALOG_READ']);
  const section=page.getByRole('region', { name: 'Catálogo público', exact: true });
  await expect(section.getByLabel('Nombre público', { exact: true })).toBeDisabled();
  await expect(section.getByRole('button', { name: 'Guardar borrador' })).toHaveCount(0);
  await expect(page.getByRole('switch', { name: 'Publicar Café', exact: true })).toHaveAttribute('aria-disabled', 'true');
});

test('company settings separate general and business controls without duplicate checkout switches', async ({ page }) => {
  await setup(page, permissions, true, '/organization/company');
  await expect(page.getByText('Logo de la Empresa', { exact: true })).toBeVisible();
  await expect(page.getByText('Inventario y Reabastecimiento por Defecto', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Configuración empresarial' }).click();
  await expect(page.getByText('Inventario y Reabastecimiento por Defecto', { exact: true })).toBeVisible();
  await expect(page.getByText('Módulos de Punto de Venta y Facturación', { exact: true })).toBeVisible();
  await expect(page.getByText('Registrar cliente al cobrar', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Imprimir factura / ticket al cobrar', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('switch')).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Catálogo público', exact: true })).toHaveCount(0);
});
