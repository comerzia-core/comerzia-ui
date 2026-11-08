import { test, expect } from '@playwright/test';
const base = { publicReference: 'InvitationOpaque', email: 'employee@example.test', roleCode: 1, roleName: 'Vendedor', branchId: 'StoreOpaque', branchName: 'Tienda', generation: 1, deliveryStatus: 'SENT' };
async function setup(page, status, expiresAt = '2099-01-01T00:00:00Z') {
  const state = { status };
  const writes = [];
  await page.route('**/*', route => {
    if (!['xhr', 'fetch'].includes(route.request().resourceType())) return route.continue();
    if (route.request().method() !== 'GET') { writes.push(route.request().url()); return route.fulfill({ json: {} }); }
    return route.fulfill({ json: { content: [{ ...base, status: state.status, expiresAt }] } });
  });
  await page.goto('/tests/saas/invitation.html?tracking=1');
  await expect(page.getByText(base.email)).toBeVisible({ timeout: 15000 });
  return { state, writes };
}
test('accepted invitation keeps delivery receipt and hides mutation actions', async ({ page }) => {
  const { writes } = await setup(page, 'ACCEPTED');
  await expect(page.getByText('Aceptada', { exact: true })).toBeVisible();
  await expect(page.getByText('Enviado', { exact: true })).toBeVisible();
  await expect(page.getByText('Completada', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reenviar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Revocar', exact: true })).toHaveCount(0);
  expect(writes).toHaveLength(0);
});
test('polling reflects acceptance without manual reload', async ({ page }) => {
  const { state, writes } = await setup(page, 'PENDING');
  await expect(page.getByRole('button', { name: 'Reenviar', exact: true })).toBeVisible();
  state.status = 'ACCEPTED';
  await expect(page.getByText('Aceptada', { exact: true })).toBeVisible({ timeout: 12000 });
  await expect(page.getByRole('button', { name: 'Reenviar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Revocar', exact: true })).toHaveCount(0);
  expect(writes).toHaveLength(0);
});
for (const status of ['REVOKED', 'EXPIRED', 'PENDING']) test(`${status} has no actions when terminal or expired`, async ({ page }) => {
  await setup(page, status, '2020-01-01T00:00:00Z');
  await expect(page.getByRole('button', { name: 'Reenviar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Revocar', exact: true })).toHaveCount(0);
});
