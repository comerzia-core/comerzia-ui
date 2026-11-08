import { test, expect } from '@playwright/test';

const token = 'd'.repeat(64);

async function mockApi(page, inspectStatus = 200) {
  const calls = [];
  await page.route('**/*', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.includes('/api/')) return route.continue();
    if (path.includes('/public/email-verification/')) {
      calls.push({ url: request.url(), method: request.method(), body: request.postDataJSON(), headers: request.headers() });
      if (path.endsWith('/inspect')) return route.fulfill({ status: inspectStatus, json: {
        valid: true, status: 'PENDING', maskedEmail: 't***@example.org', message: 'Enlace disponible.' } });
      return route.fulfill({ json: { success: true, status: 'CONSUMED', message: 'Correo verificado.' } });
    }
    if (path.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'csrf-test' } });
    if (path.endsWith('/auth/refresh')) return route.fulfill({ status: 401, json: { code: 'session_expired' } });
    return route.fulfill({ status: 204 });
  });
  return calls;
}

for (const mobile of [false, true]) {
  test(`public link protects the token and requires explicit confirmation (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 });
    const calls = await mockApi(page);
    await page.goto(`/verify-email#token=${token}`);
    const confirm = page.getByRole('button', { name: 'Confirmar mi correo electrónico' });
    await expect(confirm).toBeVisible();
    await expect(page).toHaveURL(/\/verify-email$/);
    expect(calls.filter(call => call.url.endsWith('/confirm'))).toHaveLength(0);
    expect(calls.filter(call => call.url.endsWith('/inspect')).length).toBeGreaterThan(0);
    await confirm.click();
    await expect(page.getByRole('heading', { name: '¡Correo Verificado!' })).toBeVisible();
    expect(calls.filter(call => call.url.endsWith('/confirm'))).toHaveLength(1);
    for (const call of calls) {
      expect(call.url).not.toContain(token);
      expect(call.method).toBe('POST');
      expect(call.body).toEqual({ token });
      expect(call.headers.authorization).toBeUndefined();
      expect(call.headers.cookie).toBeUndefined();
    }
    const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    expect(storage).not.toContain(token);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('inspection network error produces a recoverable visible state', async ({ page }) => {
  await mockApi(page, 503);
  await page.goto(`/verify-email#token=${token}`);
  await expect(page.getByText('No se pudo validar el enlace. Intenta nuevamente.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar mi correo electrónico' })).toHaveCount(0);
});

test('switching accounts does not render cached email ownership from the previous session', async ({ page }) => {
  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  await page.route('**/api/auth/email-verification/status', async route => {
    const second = route.request().headers().authorization === 'Bearer account-b';
    if (second) await delayed;
    await route.fulfill({ json: { email: second ? 'second@example.org' : 'first@example.org',
      status: second ? 'UNVERIFIED' : 'VERIFIED', verifiedAt: null, requestedAt: null,
      canRequest: second, cooldownSecondsRemaining: 0 } });
  });
  await page.goto('/tests/email/index.html');
  await expect(page.getByText('first@example.org', { exact: true })).toBeVisible();
  await page.evaluate(() => window.emailReview.switchAccount());
  await expect(page.getByText('first@example.org', { exact: true })).toHaveCount(0);
  release();
  await expect(page.getByText('second@example.org', { exact: true })).toBeVisible();
  await expect(page.getByText('No verificado', { exact: true })).toBeVisible();
});

async function notificationApi(page) {
  const state = { reads: 0, reminders: [{ reference: 'reminder', type: 'SECURITY_EMAIL_VERIFICATION_RECOMMENDED',
    title: 'Verify email', message: 'Verify email', actionUrl: '/profile?tab=security', createdAt: '2026-10-29T10:00:00Z', isRead: false }] };
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/notifications/reconcile')) return route.fulfill({ status: 204 });
    if (path.endsWith('/notifications')) { state.reads++; return route.fulfill({ json: state.reminders }); }
    if (path.endsWith('/profile')) return route.fulfill({ json: { id: 'owner', username: 'owner', firstName: 'Owner',
      paternalSurname: 'Test', fullName: 'Owner Test', email: 'owner@example.org', roles: [], companyName: 'Test', status: 'ACTIVE' } });
    if (path.endsWith('/auth/sessions')) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } });
    if (path.endsWith('/email-verification/status')) return route.fulfill({ json: { email: 'owner@example.org',
      status: 'UNVERIFIED', canRequest: true, cooldownSecondsRemaining: 0, requestedAt: null, verifiedAt: null } });
    return route.fulfill({ json: [] });
  });
  return state;
}

test('reminder opens Security when the profile is already mounted on Personal', async ({ page }) => {
  await notificationApi(page);
  await page.goto('/tests/email/index.html?mode=profile');
  await expect(page.getByRole('heading', { name: 'Verificación de Correo Electrónico' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Notificaciones', exact: true }).click();
  await page.getByText('Verifica tu correo', { exact: true }).click();
  await expect(page).toHaveURL(/\/profile\?tab=security$/);
  await expect(page.getByRole('heading', { name: 'Verificación de Correo Electrónico' })).toBeVisible();
});

test('notification invalidation and reconnect recover personal state over authorized HTTP', async ({ page }) => {
  const state = await notificationApi(page);
  await page.addInitScript(() => {
    const original = window.fetch;
    window.reviewStreams = [];
    window.fetch = (input, init) => {
      if (String(input).includes('/realtime/stream')) {
        const body = new ReadableStream({ start(controller) {
          window.reviewStreams.push(controller);
          controller.enqueue(new TextEncoder().encode('event: connected\ndata: {}\n\n'));
        } });
        return Promise.resolve(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }));
      }
      return original(input, init);
    };
  });
  await page.goto('/tests/email/index.html?mode=live');
  await expect.poll(() => state.reads).toBeGreaterThan(0);
  const first = state.reads;
  state.reminders = [];
  await page.evaluate(() => window.reviewStreams.at(-1).enqueue(new TextEncoder().encode('event: user-notifications-invalidated\ndata: {}\n\n')));
  await expect.poll(() => state.reads).toBeGreaterThan(first);
  const second = state.reads;
  await page.evaluate(() => window.reviewStreams.at(-1).close());
  await expect.poll(() => state.reads).toBeGreaterThan(second);
});

test('queued verification is described as a request without claiming delivery', async ({ page }) => {
  await notificationApi(page);
  await page.route('**/api/auth/email-verification/request', route => route.fulfill({
    json: { queued: true, code: 'QUEUED', message: 'Verification email queued.', cooldownSeconds: 60 },
  }));
  await page.goto('/tests/email/index.html');
  await page.getByRole('button', { name: 'Solicitar verificación', exact: true }).click();
  await expect(page.getByText('Solicitud recibida. Revisa tu correo en unos momentos.', { exact: true })).toBeVisible();
});

test('delivery failure is visible and paused transport does not accept new clicks', async ({ page }) => {
  await notificationApi(page);
  await page.route('**/api/auth/email-verification/status', route => route.fulfill({ json: {
    email: 'owner@example.org', status: 'PENDING', deliveryState: 'FAILED', canRequest: true,
    cooldownSecondsRemaining: 0, requestedAt: null, verifiedAt: null,
  } }));
  await page.goto('/tests/email/index.html');
  await expect(page.getByText('No se pudo enviar el correo. Intenta nuevamente.', { exact: true })).toBeVisible();
  await page.route('**/api/auth/email-verification/status', route => route.fulfill({ json: {
    email: 'owner@example.org', status: 'PENDING', deliveryState: 'UNAVAILABLE', canRequest: false,
    cooldownSecondsRemaining: 0, requestedAt: null, verifiedAt: null,
  } }));
  await page.reload();
  await expect(page.getByText('El envío no está disponible. Intenta más tarde.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reenviar verificación', exact: true })).toBeDisabled();
});
