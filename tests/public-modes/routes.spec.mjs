import { test, expect } from '@playwright/test';
async function setup(page, mode, {catalogs=true, landing=true, fail=false}={}) {
  await page.route('**/*',async route=>{
    if(route.request().resourceType()==='document') {
      const response=await route.fetch({url:new URL('/tests/public-modes/index.html',route.request().url()).href});
      return route.fulfill({response});
    }
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/public/platform/config') {
      expect(route.request().headers().authorization).toBeUndefined();
      await new Promise(resolve=>setTimeout(resolve,200));
      return route.fulfill({status:fail?503:200,json:{platformMode:mode,publicCatalogsEnabled:catalogs,publicLandingEnabled:landing,publicRegistrationEnabled:mode==='PUBLIC',brandName:'Fixture ERP'}});
    }
    if(path==='/api/public/catalogs/shop')return route.fulfill({json:{slug:'shop',canonicalSlug:'shop',title:'Tienda de prueba',description:'Fixture',theme:'light',template:'STUDIO',whatsapp:'59170000000',currency:'BOB',logoUrl:null,paymentQrUrl:null,facets:{categories:[],segments:[],brands:[]}}});
    if(path==='/api/public/catalogs/shop/products')return route.fulfill({json:{content:[],number:0,size:24,totalPages:0,totalElements:0}});
    if(path==='/api/public/plans')return route.fulfill({json:[]});
    return route.continue();
  });
}

test('private homepage and legal routes use the corporate presentation',async({page})=>{
  await setup(page,'PRIVATE',{landing:false});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Tu operación/})).toBeVisible();
  await expect(page.locator('a[href="/register"]')).toHaveCount(0);
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Catálogo y variantes'})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('private-landing.png'),fullPage:true});
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Política de Privacidad de Comerzia');
  await page.goto('/terms-and-conditions');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Términos y Condiciones de Comerzia');
});

test('public mode keeps its commercial homepage and legal documents',async({page})=>{
  await setup(page,'PUBLIC');
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Tu negocio');
  await expect(page.locator('a[href="/register"]').first()).toBeVisible();
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Política de Privacidad de Comerzia');
});

test('private account pages consistently use the corporate layout',async({page})=>{
  await setup(page,'PRIVATE',{landing:false});
  for(const path of ['/login','/password-reset','/verify-email','/accept-invitation','/change-email','/auth/google/result?error=access_denied']) {
    await page.goto(path);
    await expect(page.locator('.private-public')).toBeVisible();
    await expect(page.locator('.public-auth-story')).toHaveCount(0);
    await expect(page.locator('video')).toHaveCount(0);
    await expect(page.getByRole('navigation',{name:'Documentos legales'})).toBeVisible();
  }
});

for(const mode of ['PRIVATE','PUBLIC'])for(const signedIn of [false,true]) {
  test(`storefront stays public in ${mode}, authenticated=${signedIn}`,async({page})=>{
    await setup(page,mode,{landing:false});
    await page.goto('/c/shop'+(signedIn?'?signed-in':''));
    await expect(page.getByRole('heading',{name:'Tienda de prueba'}).first()).toBeVisible();
    await expect(page).toHaveURL(/\/c\/shop/);
  });
}

test('disabled storefront displays its unavailable state without redirecting',async({page})=>{
  await setup(page,'PRIVATE',{catalogs:false});
  await page.goto('/c/shop?signed-in');
  await expect(page.getByRole('heading',{name:'Catálogo no disponible'})).toBeVisible();
  await expect(page).toHaveURL(/\/c\/shop/);
});

test('failed configuration stays on the requested route and offers retry',async({page})=>{
  await setup(page,'PUBLIC',{fail:true});
  await page.goto('/c/shop');
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar');
  await expect(page.getByRole('button',{name:'Reintentar',exact:true})).toBeVisible();
  await expect(page).toHaveURL(/\/c\/shop/);
});
