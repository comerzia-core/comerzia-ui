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

test('a stalled browser lock becomes retryable without bypassing rotation', async ({ page, context }) => {
  test.setTimeout(40000);
  await setup(context);
  await page.addInitScript(() => {
    void navigator.locks.request('comerzia-browser-authentication', () => new Promise(resolve => {
      window.releaseAuthenticationLock = resolve;
    }));
  });
  await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('temporarily_unavailable', { timeout: 22000 });
  expect((await page.evaluate(() => window.sessionTest.snapshot())).token).toBeNull();
  await page.evaluate(() => window.releaseAuthenticationLock());
  await page.evaluate(() => window.sessionTest.initialize());
  await expect(page.getByRole('status')).toHaveText('authenticated');
});


test('logout succeeds when revocation notification arrives before HTTP response', async ({ page, context }) => {
  await setup(context); await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated');
  await page.route('**/api/auth/logout', async route => {
    await page.evaluate(() => {
      const channel = new BroadcastChannel('comerzia-session');
      channel.postMessage({ type: 'logout', sessionId: window.sessionTest.snapshot().sessionId });
      channel.close();
    });
    await expect(page.getByRole('status')).toHaveText('anonymous');
    await route.fulfill({ status: 204 });
  });
  expect(await page.evaluate(() => window.sessionTest.logout())).toBe(true);
});

test('MFA confirmation adopts a rotated session without losing a draft and logs out the previous tab', async ({ page, context }) => {
  await setup(context); await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated');
  const other = await context.newPage(); await other.goto('/tests/sessions/index.html');
  await expect(other.getByRole('status')).toHaveText('authenticated');
  await page.getByLabel('Borrador').fill('Venta conservada tras TOTP');
  expect(await page.evaluate(() => window.sessionTest.completeEnrollment('rotated-mfa-session'))).toBe(true);
  await expect(page.getByRole('status')).toHaveText('authenticated');
  await expect(page.getByLabel('Borrador')).toHaveValue('Venta conservada tras TOTP');
  await expect(other.getByRole('status')).toHaveText('anonymous');
  expect((await page.evaluate(() => window.sessionTest.snapshot())).sessionId).toBe('rotated-mfa-session');
  expect(await page.evaluate(() => JSON.stringify({local:localStorage,session:sessionStorage}))).not.toContain('signature');
});

test('MFA session response for another subject cannot replace the current identity', async ({ page, context }) => {
  await setup(context); await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated');
  expect(await page.evaluate(() => window.sessionTest.completeEnrollment('wrong-subject-session','other-account'))).toBe(false);
  expect((await page.evaluate(() => window.sessionTest.snapshot())).sessionId).toBe('browser-a');
});

test('a rejected sensitive mutation waits for step-up and retries exactly its captured payload', async ({ page, context }) => {
  await setup(context);
  let writes=0;let approvedIntent;
  await context.route('**/api/auth/mfa/step-up',async route=>{
    approvedIntent=route.request().postDataJSON();
    return route.fulfill({json:{grantToken:'fixture-once',expiresAt:'2030-01-01T00:00:00Z',action:'UPDATE_USER_ACCESS'}});
  });
  await context.route('**/api/tenant/example-access',async route=>{
    writes++;
    expect(route.request().postDataJSON()).toEqual({disabled:true});
    if(!route.request().headers()['x-mfa-step-up-grant']) return route.fulfill({status:403,json:{code:'mfa_step_up_required',errors:[{field:'actionType',reason:'UPDATE_USER_ACCESS'}]}});
    expect(route.request().headers()['x-mfa-step-up-grant']).toBe('fixture-once');
    return route.fulfill({json:{ok:true}});
  });
  await page.goto('/tests/sessions/index.html');await expect(page.getByRole('status')).toHaveText('authenticated');
  await page.evaluate(()=>window.sessionTest.mutate({disabled:true}));
  await expect(page.getByRole('dialog',{name:'Confirmar modificación de acceso'})).toBeVisible();expect(writes).toBe(1);
  await page.getByLabel('Código de la app autenticadora').fill('123456');
  await page.getByRole('button',{name:'Autorizar',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.sessionTest.writeResult)).toBe('saved');expect(writes).toBe(2);
  expect(approvedIntent.targetId).toMatch(/^PATCH:\/tenant\/example-access#[0-9a-f]{64}$/);
});

test('Escape cancels step-up without replaying the mutation or losing the current draft', async ({ page, context }) => {
  await setup(context);
  let writes=0;
  await context.route('**/api/tenant/example-access',async route=>{
    writes++;
    return route.fulfill({status:403,json:{code:'mfa_step_up_required',errors:[{field:'actionType',reason:'UPDATE_USER_ACCESS'}]}});
  });
  await page.goto('/tests/sessions/index.html');
  await expect(page.getByRole('status')).toHaveText('authenticated');
  await page.getByRole('textbox',{name:'Borrador'}).fill('Retain this draft');
  await page.evaluate(()=>window.sessionTest.mutate({disabled:true}));
  const dialog=page.getByRole('dialog',{name:'Confirmar modificación de acceso'});
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>window.sessionTest.writeResult)).toBe('rejected');
  await expect(page.getByRole('textbox',{name:'Borrador'})).toHaveValue('Retain this draft');
  await expect(page.getByRole('status')).toHaveText('authenticated');
  expect(writes).toBe(1);
});
