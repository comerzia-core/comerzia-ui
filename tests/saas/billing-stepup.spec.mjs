import { test, expect } from '@playwright/test';
const payment = { id: 'PaymentOpaque', companyName: 'Empresa de prueba', planName: 'Inicial', planTypeCode: 702, months: 1, amount: 49, currency: 'BOB', reference: 'REF-TEST', statusCode: 1401, statusLabel: 'Pendiente', pending: true, requestedAt: '2026-11-06T10:00:00Z', reviewedAt: null, message: null, receiptUrl: null };
async function openReview(page, info, transport = false, configured = true) {
  const reviews = [], challenges = [];
  await page.route('**/api/**', route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace(/^.*?\/api/, '');
    if (path === '/auth/mfa/step-up') { challenges.push(req.postDataJSON()); return route.fulfill({ json: { grantToken: 'fixture-grant', expiresAt: '2099-01-01T00:00:00Z', action: 'UPDATE_SECURITY_SETTINGS' } }); }
    if (path.endsWith('/review')) {
      reviews.push({ body: req.postDataJSON(), grant: req.headers()['x-mfa-step-up-grant'] });
      return reviews.at(-1).grant === 'fixture-grant' ? route.fulfill({ json: { ...payment, pending: false } }) : route.fulfill({ status: 403, json: { code: 'mfa_step_up_required', message: 'Recent MFA verification is required', errors: [{ field: 'actionType', reason: 'UPDATE_SECURITY_SETTINGS' }] } });
    }
    if (path === '/auth/csrf') return route.fulfill({ json: { token: 'csrf-fixture' } });
    if (path === '/profile/mfa') return route.fulfill({ json: { configured, status: configured ? 'ACTIVE' : 'NOT_CONFIGURED' } });
    if (path === '/generic/dictionaries') return route.fulfill({ json: {} });
    if (path === '/saas/billing/requests') return route.fulfill({ json: { content: [payment], totalElements: 1, totalPages: 1 } });
    return route.fulfill({ json: {} });
  });
  await page.goto('/tests/saas/index.html?role=SAAS_FINANCE&path=/saas/billing/verification');
  await expect(page.getByText('Empresa de prueba', { exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
  if (transport) {
    await page.evaluate(() => { void import('/src/lib/axios.ts').then(({ default: api }) => api.post('/saas/billing/requests/PaymentOpaque/review', { approved: true, message: 'llegó xd', receivedAmount: 49, bankVerified: true })).catch(() => {}); });
    return { reviews, challenges };
  }
  const item = page.getByText('Empresa de prueba', { exact: true }).filter({ visible: true }).first();
  await item.click(info.project.name === 'mobile' ? {} : { button: 'right' });
  await page.getByText('Ver solicitud', { exact: true }).click();
  await page.getByText('Verifiqué esta transferencia en la cuenta bancaria', { exact: true }).click();
  await page.getByLabel('Mensaje al cliente', { exact: true }).fill('llegó xd');
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
  return { reviews, challenges };
}
test('payment review requests MFA before POST and binds the approved payload', async ({ page }, info) => {
  const { reviews, challenges } = await openReview(page, info);
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toBeVisible();
  expect(reviews).toHaveLength(0);
  // Simula un cambio del formulario mientras la intención original espera autorización.
  await page.getByLabel('Mensaje al cliente', { exact: true }).fill('Modificado durante MFA', { force: true });
  await page.getByLabel('Código de la app autenticadora', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Autorizar', exact: true }).click();
  await expect.poll(() => reviews.length).toBe(1);
  expect(reviews[0]).toEqual({ body: { approved: true, message: 'llegó xd', receivedAmount: 49, bankVerified: true }, grant: 'fixture-grant' });
  expect(challenges[0].action).toBe('UPDATE_SECURITY_SETTINGS');
  expect(challenges[0].targetId).toMatch(/^POST:\/saas\/billing\/requests\/PaymentOpaque\/review#[a-f0-9]{64}$/);
});
test('cancelled payment MFA never retries the mutation', async ({ page }, info) => {
  const { reviews, challenges } = await openReview(page, info);
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toBeVisible();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Confirmar configuración sensible' });
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toHaveCount(0);
  expect(reviews).toHaveLength(0);
  expect(challenges).toHaveLength(0);
});

test('shared transport handles exact 403 contract and retries the same intent once', async ({ page }, info) => {
  const { reviews, challenges } = await openReview(page, info, true);
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toBeVisible();
  expect(reviews).toHaveLength(1);
  await page.getByLabel('Código de la app autenticadora', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Autorizar', exact: true }).click();
  await expect.poll(() => reviews.length).toBe(2);
  expect(reviews[1]).toEqual({ body: reviews[0].body, grant: 'fixture-grant' });
  expect(challenges).toHaveLength(1);
});

test('leaving review while MFA is pending cannot send a payment mutation', async ({ page }, info) => {
  const { reviews, challenges } = await openReview(page, info);
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toBeVisible();
  await page.evaluate(() => window.saasTest.navigate('/login'));
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toHaveCount(0);
  expect(reviews).toHaveLength(0);
  expect(challenges).toHaveLength(0);
});

test('session expiry during MFA cannot send the captured payment', async ({ page }, info) => {
  const { reviews, challenges } = await openReview(page, info);
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toBeVisible();
  await page.evaluate(async () => { const { useAuthStore } = await import('/src/stores/useAuthStore.ts'); useAuthStore.getState().expireSession('session_access_changed'); });
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toHaveCount(0);
  expect(reviews).toHaveLength(0);
  expect(challenges).toHaveLength(0);
});

test('account without a factor receives enrollment guidance without an OTP prompt or mutation', async ({ page }, info) => {
  const { reviews, challenges } = await openReview(page, info, false, false);
  await expect(page.getByText('Activa 2FA desde Perfil → Seguridad antes de revisar pagos. Luego vuelve a esta solicitud.')).toBeVisible();
  await expect(page.getByLabel('Código de la app autenticadora', { exact: true })).toHaveCount(0);
  expect(reviews).toHaveLength(0);
  expect(challenges).toHaveLength(0);
});
