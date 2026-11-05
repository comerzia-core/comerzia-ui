import { test, expect } from '@playwright/test';
for(const theme of ['light','dark','cupcake','coffee']) test(`compiled component geometry ${theme}`,async ({page})=>{
  await page.route('**/api/**', route => route.fulfill({json:[]}));
  await page.goto('/');
  const geometry=await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    const modal=document.createElement('div');modal.className='modal modal-open modal-middle';
    modal.innerHTML='<div class="modal-box">Style probe</div>';document.body.append(modal);
    const menu=document.createElement('ul');menu.className='menu menu-sm';menu.innerHTML='<li><a>Profile</a></li>';document.body.append(menu);
    const style=getComputedStyle(modal),box=modal.firstElementChild.getBoundingClientRect();
    return {position:style.position,display:style.display,menuDisplay:getComputedStyle(menu).display,
      x:box.x,right:box.right,bottom:box.bottom,width:innerWidth,height:innerHeight};
  },theme);
  expect(geometry.position).toBe('fixed');expect(geometry.display).toBe('grid');expect(geometry.menuDisplay).toBe('flex');
  expect(geometry.x).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.height);
});
