import { test, expect } from '@playwright/test';
const roles = [
  { id: 'OwnerOpaque', name: 'OWNER', displayName: 'Dueño de empresa' },
  { id: 'SellerOpaque', name: 'SELLER', displayName: 'Vendedor operativo' },
  { id: 'RootOpaque', name: 'ROOT', displayName: 'Root prohibido' },
  { id: 'SaasOpaque', name: 'SAAS_ADMIN', displayName: 'SaaS prohibido' },
];
async function openModal(page, { actor = 'OWNER', stores = true } = {}) {
  const submissions = [];
  await page.route('**/*', route => {
    if (route.request().resourceType() !== 'xhr' && route.request().resourceType() !== 'fetch') return route.continue();
    const path = new URL(route.request().url()).pathname.replace(/^.*\/api/, '');
    if (path === '/roles') return route.fulfill({ json: roles });
    if (path === '/tenant/branches/active') return route.fulfill({ json: stores ? [{ id: 'BranchOpaque', name: 'Tienda central' }] : [] });
    if (path === '/tenant/employee-invitations') {
      submissions.push(route.request().postDataJSON());
      // API simulada: la autorización y los permisos TOTP reales se prueban en las suites HTTP backend.
      return route.fulfill({ status: 201, json: { publicReference: 'InvitationOpaque' } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto(`/tests/saas/invitation.html?role=${actor}`);
  await expect(page.getByText('Vendedor operativo', { exact: true })).toBeVisible();
  await expect(page.getByText('Root prohibido', { exact: true })).toHaveCount(0);
  await expect(page.getByText('SaaS prohibido', { exact: true })).toHaveCount(0);
  await page.getByPlaceholder('colaborador@empresa.com').fill('fixture.employee@example.test');
  return submissions;
}
test('real modal offers OWNER to owner and clears store when combined with operational role', async ({ page }) => {
  const submissions = await openModal(page);
  await expect(page.getByText('Dueño de empresa', { exact: true })).toBeVisible();
  await page.getByText('Vendedor operativo', { exact: true }).click();
  await expect(page.getByText('Tienda central', { exact: true })).toBeVisible();
  await expect(page.getByText('Tienda central', { exact: true }).locator('xpath=ancestor::label').getByRole('checkbox')).toBeChecked();
  await page.getByText('Dueño de empresa', { exact: true }).click();
  await expect(page.getByText('Ámbito Corporativo Global:', { exact: true })).toBeVisible();
  await expect(page.getByText('Tienda central', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enviar Invitación', exact: true }).click();
  await expect.poll(() => submissions.length).toBe(1);
  expect(submissions[0]).toMatchObject({ roleIds: ['SellerOpaque', 'OwnerOpaque'], branchId: null });
});
test('real modal hides OWNER for non-owner and blocks operational invitation without store', async ({ page }) => {
  const submissions = await openModal(page, { actor: 'BRANCH_MANAGER', stores: false });
  await expect(page.getByText('Dueño de empresa', { exact: true })).toHaveCount(0);
  await page.getByText('Vendedor operativo', { exact: true }).click();
  await expect(page.getByText('No hay sucursales activas registradas en la empresa.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar Invitación', exact: true }).click();
  await expect(page.getByText('Debes seleccionar una sucursal para el colaborador.', { exact: true })).toBeVisible();
  expect(submissions).toHaveLength(0);
});
test('removing OWNER restores required store and operational payload includes its id', async ({ page }) => {
  const submissions = await openModal(page);
  await page.getByText('Dueño de empresa', { exact: true }).click();
  await page.getByText('Vendedor operativo', { exact: true }).click();
  await page.getByText('Dueño de empresa', { exact: true }).click();
  await expect(page.getByText('Ámbito Corporativo Global:', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Tienda central', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar Invitación', exact: true }).click();
  await expect.poll(() => submissions.length).toBe(1);
  expect(submissions[0]).toMatchObject({ roleIds: ['SellerOpaque'], branchId: 'BranchOpaque' });
});
