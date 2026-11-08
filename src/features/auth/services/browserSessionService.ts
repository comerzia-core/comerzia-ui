import axios from 'axios';
import type { TotpEnrollmentStartResponse } from '../../security/types/mfa';

export interface BrowserAuthentication {
  token: string | null;
  sessionId: string;
  expiresAt: string;
  absoluteExpiresAt: string;
  idleSeconds: number;
  mfaRequired?: boolean;
  mfaType?: string;
  authenticationState?: 'FULLY_AUTHENTICATED' | 'MFA_PENDING' | 'MFA_ENROLLMENT_REQUIRED' | 'RECOVERY_RESTRICTED' | string;
  recoveryCodes?: string[];
  message?: string;
}

const transport = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true, timeout: 15000 });
let renewal: Promise<BrowserAuthentication> | null = null;

export async function csrfHeaders(): Promise<Record<string, string>> {
  const { data } = await transport.get<{ token: string }>('/auth/csrf', { headers: { 'Cache-Control': 'no-store' } });
  return { 'X-CSRF-TOKEN': data.token };
}

async function exclusive<T>(action: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request('comerzia-browser-authentication', { signal: AbortSignal.timeout(15000) }, action);
  // El backend conserva consumo único aunque el navegador no ofrezca coordinación entre pestañas.
  return action();
}

export function refreshBrowserSession(): Promise<BrowserAuthentication> {
  if (!renewal) {
    renewal = exclusive(async () => {
      const headers = await csrfHeaders();
      const { data } = await transport.post<BrowserAuthentication>('/auth/refresh', {}, { headers });
      return data;
    }).finally(() => { renewal = null; });
  }
  return renewal;
}

export async function closeBrowserSession(token?: string | null, all = false): Promise<void> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    if (token && all) headers.Authorization = `Bearer ${token}`;
    await transport.post(all ? '/auth/logout-all' : '/auth/logout', {}, { headers });
  });
}

export function authenticationErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError<{ code?: string }>(error)) return undefined;
  return error.response?.data?.code;
}

export function authenticationRejected(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function tokenSessionReference(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload: unknown = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload === 'object' && payload !== null && 'sid' in payload && typeof payload.sid === 'string' ? payload.sid : null;
  } catch { return null; }
}

export function submitBrowserCredentials(path: '/auth/login' | '/auth/change-temporary-password' | '/public/registrations', body: unknown): Promise<BrowserAuthentication> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    const { data } = await transport.post<BrowserAuthentication>(path, body, { headers });
    return data;
  });
}

export function verifyMfaLogin(code: string): Promise<BrowserAuthentication> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    const { data } = await transport.post<BrowserAuthentication>('/auth/mfa/verify-login', { code }, { headers });
    return data;
  });
}

export function verifyMfaRecovery(recoveryCode: string): Promise<BrowserAuthentication> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    const { data } = await transport.post<BrowserAuthentication>('/auth/mfa/verify-recovery', { recoveryCode }, { headers });
    return data;
  });
}

export function startPendingMfaEnrollment(): Promise<TotpEnrollmentStartResponse> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    const { data } = await transport.post<TotpEnrollmentStartResponse>('/auth/mfa/enroll/start', {}, { headers });
    return data;
  });
}

export function confirmPendingMfaEnrollment(code: string): Promise<BrowserAuthentication> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    const { data } = await transport.post<BrowserAuthentication>('/auth/mfa/enroll/confirm', { code }, { headers });
    return data;
  });
}

export function cancelPendingMfaEnrollment(): Promise<void> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    await transport.post('/auth/mfa/enroll/cancel', {}, { headers });
  });
}

export async function getMfaPendingStatus(): Promise<{ sessionId: string; remainingSeconds: number; mfaRequired: boolean; authenticationState: string }> {
  const { data } = await transport.get<{ sessionId: string; remainingSeconds: number; mfaRequired: boolean; authenticationState: string }>('/auth/mfa/pending-status');
  return data;
}

export function authenticationPending(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403 && authenticationErrorCode(error) === 'session_authentication_incomplete';
}

export function consumeEmergencyMfaAuthorization(authorization: string): Promise<BrowserAuthentication> {
  return exclusive(async () => {
    const headers = await csrfHeaders();
    const { data } = await transport.post<BrowserAuthentication>('/auth/mfa/emergency/consume', { authorization }, { headers });
    return data;
  });
}
