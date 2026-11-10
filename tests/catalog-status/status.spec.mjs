import { test, expect } from '@playwright/test';

for (const [level, title, affected] of [['categories','Categoría','rubros'],['segments','Rubro','marcas'],['brands','Marca','productos']]) {
  test(`${level} require confirmation before persisting a status change`, async ({ page }) => {
    const writes=[];
    const category={id:'category',name:'CATEGORY',status:true};
    const segment={id:'segment',name:'SEGMENT',status:true,category};
    const brand={id:'brand',name:'BRAND',status:true,segment};
    await page.route('**/api/**', route => {
      const request=route.request(); const path=new URL(request.url()).pathname;
      if(request.method()==='PUT') {
        writes.push({path,body:request.postDataJSON()});
        return route.fulfill({json:{}});
      }
      if(path==='/api/tenant/categories')return route.fulfill({json:[category]});
      if(path.includes('/segments/category/'))return route.fulfill({json:[segment]});
      if(path.includes('/brands/segment/'))return route.fulfill({json:[brand]});
      if(path==='/api/tenant/products')return route.fulfill({json:{content:[],totalElements:0,totalPages:0,number:0,size:5}});
      return route.fulfill({json:[]});
    });
    await page.goto('/tests/catalog-status/index.html?category=category&segment=segment&brand=brand');
    const wrapper=page.locator('.form-control').filter({has:page.getByText(new RegExp(`^[123]\\. ${title}$`))});
    const input=wrapper.getByPlaceholder('Buscar o crear...');
    await expect(input).not.toHaveValue('');
    async function openConfirmation() {
      await input.click();
      await page.getByTitle(`Editar ${title}`,{exact:true}).click({force:true});
      await page.getByRole('switch').click();
      await expect(page.getByRole('dialog')).toContainText(affected);
      await expect(page.getByRole('dialog')).toContainText('¿Continuar?');
    }
    await openConfirmation();
    expect(writes).toEqual([]);
    await page.getByRole('button',{name:'Cancelar',exact:true}).click();
    expect(writes).toEqual([]);
    await openConfirmation();
    await page.getByRole('button',{name:'Aplicar cambio',exact:true}).click();
    await expect.poll(()=>writes.length).toBe(1);
    expect(writes[0].path).toContain('/'+level+'/');
    expect(writes[0].body.status).toBe(false);
  });
}

test('inactive authorized suggestions are red and remain selectable', async ({page})=>{
  await page.route('**/api/tenant/sales-catalog/suggestions**',route=>route.fulfill({json:[{
    variantId:'opaque',label:'Fixture product',description:'Fixture',status:false,
  }]}));
  await page.goto('/tests/catalog-status/index.html?search');
  await page.getByPlaceholder('Buscar por nombre, SKU o escanear código...').fill('Fixture');
  await expect(page.getByText('Inactivo',{exact:true})).toBeVisible();
  await expect(page.locator('li').filter({hasText:'Fixture product'})).toHaveClass(/bg-error/);
  await page.getByRole('button',{name:'Seleccionar Fixture product',exact:true}).click();
  await expect(page.locator('output')).toHaveText('opaque');
});
