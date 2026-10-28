export function authenticationFixture(reference = 'browser-fixture') {
  const payload = Buffer.from(JSON.stringify({ sid: reference })).toString('base64url');
  return { token: 'fixture.' + payload + '.signature', sessionId: reference,
    expiresAt: '2030-01-01T00:05:00Z', absoluteExpiresAt: '2030-01-01T08:00:00Z', idleSeconds: 1800 };
}
export async function mockAnonymousSession(page) {
  await page.route('**/auth/csrf', route => route.fulfill({ json: { token: 'csrf-fixture' } }));
  await page.route('**/auth/refresh', route => route.fulfill({ status: 401, json: { code: 'session_expired' } }));
  await page.route('**/auth/logout', route => route.fulfill({ status: 204 }));
}
