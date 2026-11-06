import { test, expect } from '@playwright/test';
import { mockAnonymousSession } from '../fixtures/browserSession.mjs';
const token = 'invitation-review-fixture';
const continuation = 'google-review-fixture';
test.beforeEach(async ({ page }) => {
  await mockAnonymousSession(page);
  await page.route('**/auth/identity-options', route => route.fulfill({ json: { googleOidcEnabled: true } }));
  await page.route('**/public/employee-invitations/inspect', route => route.fulfill({ json: {
    status: 'PENDING', companyName: 'Empresa ficticia', roleName: 'Vendedor', emailMasked: 'a***@example.test', branchName: 'Central'
  } }));
});
test('local invitation uses production form, strong password and protected request', async ({ page }) => {
  let submitted;
  await page.route('**/public/employee-invitations/accept', route => {
    submitted = route.request().postDataJSON();
    expect(route.request().headers()['x-csrf-token']).toBe('csrf-fixture');
    return route.fulfill({ status: 409, json: { code: 'invitation_capacity_unavailable', message: 'SQL private detail' } });
  });
  await page.goto(`/accept-invitation#token=${token}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Únete a la empresa')).toBeVisible();
  expect(page.url()).not.toContain(token);
  await page.getByPlaceholder('Tu nombre', { exact: true }).fill('Ana');
  await page.getByPlaceholder('Apellido paterno', { exact: true }).fill('Perez');
  await page.getByPlaceholder('usuario', { exact: true }).fill('ana.review');
  await page.getByPlaceholder('Contraseña segura', { exact: true }).fill('StrongPassword123!');
  await page.getByPlaceholder('Repite la contraseña', { exact: true }).fill('StrongPassword123!');
  await page.getByRole('button', { name: 'Aceptar invitación y crear cuenta' }).click();
  await expect(page.getByText(/El propietario también ocupa un cupo/)).toBeVisible();
  expect(submitted).toMatchObject({ token, method: 'PASSWORD', username: 'ana.review', password: 'StrongPassword123!' });
  await expect(page.getByText('SQL private detail')).toHaveCount(0);
});
test('Google invitation binds token and returns without history or storage secrets', async ({ page }) => {
  let started, accepted;
  await page.route('**/auth/oidc/google/start', route => {
    started = route.request().postDataJSON();
    return route.fulfill({ json: { authorizationUrl: 'https://localhost:5201/auth/google/result', state: 'state-fixture' } });
  });
  await page.route('**/auth/oidc/google/complete', route => route.fulfill({ json: {
    status: 'INVITATION_VERIFIED', continuationToken: continuation, invitationReferenceToken: token,
  } }));
  await page.route('**/public/employee-invitations/accept', route => {
    accepted = route.request().postDataJSON();
    return route.fulfill({ status: 409, json: { code: 'invitation_expired' } });
  });
  await page.goto(`/accept-invitation#token=${token}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Unirme con Google' }).click();
  await expect(page.getByRole('button', { name: 'Confirmar y unirme con Google' })).toBeVisible();
  expect(started).toEqual({ purpose: 'INVITATION', invitationToken: token });
  const persisted = await page.evaluate(() => JSON.stringify({ history: history.state, local: { ...localStorage }, session: { ...sessionStorage }, href: location.href }));
  expect(persisted).not.toContain(token);
  expect(persisted).not.toContain(continuation);
  await page.getByRole('button', { name: 'Confirmar y unirme con Google' }).click();
  await expect(page.getByText(/Esta invitación ha expirado/)).toBeVisible();
  expect(accepted).toEqual({ token, method: 'GOOGLE', googleContinuationToken: continuation });
});
for (const status of ['MFA_PENDING', 'MFA_ENROLLMENT_REQUIRED', 'RECOVERY_RESTRICTED']) {
  test(`Google ${status} enters limited authentication flow`, async ({ page }) => {
    let enrollmentRequests = 0;
    await page.route('**/auth/oidc/google/complete', route => route.fulfill({ json: { status } }));
    await page.route('**/auth/mfa/enroll/start', route => {
      enrollmentRequests++;
      return route.fulfill({ json: { secret: 'fixture', otpauthUri: 'otpauth://totp/fixture?secret=JBSWY3DPEHPK3PXP' } });
    });
    await page.goto('/auth/google/result', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: status === 'MFA_PENDING' ? 'Doble factor' : 'Configura tu segundo factor' })).toBeVisible();
    if (status !== 'MFA_PENDING') await expect.poll(() => enrollmentRequests).toBe(1);
    await expect(page.getByLabel('Usuario o correo electrónico', { exact: true })).toHaveCount(0);
  });
}
