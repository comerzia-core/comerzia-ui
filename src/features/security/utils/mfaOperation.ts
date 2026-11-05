import type { MfaStepUpActionType } from '../types/mfa';
const defaults: Record<MfaStepUpActionType, string> = {
  REPLACE_MFA: 'POST:/profile/mfa/totp/enroll/start',
  REGENERATE_RECOVERY_CODES: 'POST:/profile/mfa/recovery-codes/regenerate',
  DEACTIVATE_MFA: 'POST:/profile/mfa/deactivate',
  MANAGE_SAAS_TEAM: 'POST:/saas/team', ASSIGN_ROLES: 'PUT:/tenant/users',
  UPDATE_USER_ACCESS: 'PATCH:/tenant/users', ADMIN_MFA_RECOVERY: 'POST:/saas/team/recovery/requests',
  UPDATE_SECURITY_SETTINGS: 'PUT:/saas/billing/settings',
  INVITE_EMPLOYEE: 'POST:/tenant/employee-invitations'
};
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => JSON.stringify(key) + ':' + canonical(item)).join(',') + '}';
  return JSON.stringify(value);
}
export async function bindMfaOperation(action: MfaStepUpActionType, target?: string, body?: unknown): Promise<string> {
  const [path, rawQuery = ''] = (target ?? defaults[action]).split('?');
  const parameters = new URLSearchParams(rawQuery);
  const query = Object.fromEntries([...new Set(parameters.keys())].sort().map(key => [key, parameters.getAll(key)]));
  let payload: unknown = body ?? null;
  if (body instanceof FormData) {
    const settings = body.get('settings');
    const parsed: unknown = settings === null ? null : JSON.parse(settings instanceof Blob ? await settings.text() : settings);
    const files: Record<string, { digest: string; name: string; type: string }[]> = {};
    for (const [field, value] of body.entries()) {
      if (field === 'settings') continue;
      if (!(value instanceof File)) throw new Error('mfa_multipart_context_invalid');
      const digest = await crypto.subtle.digest('SHA-256', await value.arrayBuffer());
      (files[field] ??= []).push({ digest: [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,'0')).join(''), name: value.name, type: value.type });
    }
    payload = { body: parsed, files };
  }
  const serialized = canonical(JSON.parse(JSON.stringify(payload))) + '\n' + canonical(query);
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
  return path + '#' + [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}
