import api from '../../../lib/axios';
export interface PrivilegedRecoveryRequest {
  reference: string; targetUsername: string; identityCase: string;
  expiresAt: string; approvals: number; issued: boolean;
}
export interface RecoveryAuthorization { token: string; expiresAt: string }
const base = '/saas/security/privileged-recovery';
export const privilegedRecoveryService = {
  list: async () => (await api.get<PrivilegedRecoveryRequest[]>(base)).data,
  create: async (body: { targetUsername: string; identityCase: string }, grant: string) =>
    (await api.post<PrivilegedRecoveryRequest>(base, body, { headers: { 'X-Mfa-Step-Up-Grant': grant } })).data,
  approve: async (reference: string, grant: string) =>
    (await api.post<PrivilegedRecoveryRequest>(`${base}/${reference}/approve`, { identityVerified: true }, { headers: { 'X-Mfa-Step-Up-Grant': grant } })).data,
  issue: async (reference: string, grant: string) =>
    (await api.post<RecoveryAuthorization>(`${base}/${reference}/issue`, null, { headers: { 'X-Mfa-Step-Up-Grant': grant } })).data,
};
