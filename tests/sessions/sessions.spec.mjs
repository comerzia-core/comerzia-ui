import { test, expect } from '@playwright/test';
import { authenticationFixture } from '../fixtures/browserSession.mjs';
async function setup(context) {
  const state = { renewals: 0, inflight: 0, maxInflight: 0, expired: false, revoked: false, outage: false, pending: false, deny: false, reads: 0, sid: 'browser-a' };
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'csrf-test' } });
    if (path.endsWith('/auth/refresh')) {
      expect(route.request().headers()['x-csrf-token']).toBe('csrf-test');
      state.renewals++; state.inflight++; state.maxInflight = Math.max(state.inflight, state.maxInflight);
      await new Promise(resolve => setTimeout(resolve, 60)); state.inflight--;
      if (state.pending) return route.fulfill({ status: 403, json: { code: 'session_authentication_incomplete' } });
      if (state.outage) return route.fulfill({ status: 503, json: { code: 'authentication_temporarily_unavailable' } });
      if (state.revoked) return route.fulfill({ status: 401, json: { code: 'session_revoked' } });
      state.expired = false;
      return route.fulfill({ json: authenticationFixture(state.sid) });
    }
    if (path.endsWith('/auth/login')) return route.fulfill({ json: authenticationFixture(state.sid) });
    if (path.endsWith('/auth/logout')) {
      if (state.outage) return route.fulfill({ status: 503, json: {} });
      state.revoked = true; return route.fulfill({ status: 204 });
    }
    if (state.expired) return route.fulfill({ status: 401, json: { code: 'access_token_expired' } });
    if (state.revoked) return route.fulfill({ status: 401, json: { code: 'session_revoked' } });
    if (path.endsWith('/auth/profile')) return route.fulfill({ json: { id: 'owner', username: 'owner', firstName: 'Ana', roles: ['OWNER'], permissions: [], theme: 'light' } });
    if (path.endsWith('/menus/my-tree')) return route.fulfill({ json: [] });
    if (path.endsWith('/example')) {
      state.reads++;
      return route.fulfill({ status: state.deny ? 403 : 200, json: { ok: !state.deny } });
    }
    return route.fulfill({ status: 204 });
  });
  return state;
}
test('reload restores session without credentials in storage', async ({ page, context }) => {
  await setup(context); await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated');
  await page.reload(); await expect(page.getByRole('status')).toHaveText('authenticated');
  const stored = await page.evaluate(() => JSON.stringify({ local: localStorage, session: sessionStorage }));
  expect(stored).not.toContain('signature'); expect(stored).not.toContain('refresh');
});
test('simultaneous expired calls refresh once and preserve draft', async ({ page, context }) => {
  const state = await setup(context); await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated');
  await page.getByLabel('Borrador').fill('Venta pendiente'); state.expired = true;
  const values = await page.evaluate(() => Promise.all(Array.from({ length: 8 }, () => window.sessionTest.read())));
  expect(values.every(v => v.ok)).toBe(true); expect(state.renewals).toBe(2);
  await expect(page.getByLabel('Borrador')).toHaveValue('Venta pendiente');
});
test('profile access expiration renews but permission denial does not', async ({ page, context }) => {
  const state = await setup(context); await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated'); state.expired = true;
  await page.evaluate(() => window.sessionTest.read('/auth/profile')); expect(state.renewals).toBe(2);
  state.deny = true; await page.evaluate(() => window.sessionTest.read().catch(() => null));
  expect(state.renewals).toBe(2); await expect(page.getByRole('status')).toHaveText('authenticated');
});
test('two tabs serialize rotation and server logout reaches both', async ({ page, context }) => {
  const state = await setup(context); const other = await context.newPage();
  await Promise.all([page.goto('/tests/sessions/index.html'), other.goto('/tests/sessions/index.html')]);
  await expect(page.getByRole('status')).toHaveText('authenticated'); await expect(other.getByRole('status')).toHaveText('authenticated');
  expect(state.maxInflight).toBe(1);
  expect(await page.evaluate(() => window.sessionTest.logout())).toBe(true);
  await expect(other.getByRole('status')).toHaveText('anonymous'); await other.reload();
  await expect(other.getByRole('status')).toHaveText('anonymous');
});
test('persistence outage is retryable and logout failure does not claim revocation', async ({ page, context }) => {
  const state = await setup(context); state.outage = true; await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('temporarily_unavailable'); state.outage = false;
  await page.evaluate(() => window.sessionTest.initialize()); await expect(page.getByRole('status')).toHaveText('authenticated');
  state.outage = true; expect(await page.evaluate(() => window.sessionTest.logout())).toBe(false);
  await expect(page.getByRole('status')).toHaveText('authenticated');
});
test('renewal after another account login never replays old business request', async ({ page, context }) => {
  const state = await setup(context); await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated'); state.sid = 'browser-b'; state.expired = true;
  await page.evaluate(() => window.sessionTest.read().catch(() => null));
  expect(state.reads).toBe(0); await expect(page.getByRole('status')).toHaveText('anonymous');
});

test('incomplete authentication never exposes business credentials', async ({ page, context }) => {
  const state = await setup(context); state.pending = true;
  await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('mfa_pending');
  const snapshot = await page.evaluate(() => window.sessionTest.snapshot());
  expect(snapshot.token).toBeNull(); expect(state.reads).toBe(0);
});
