import axios from 'axios';
import api from '../../../lib/axios';
import { csrfHeaders, type BrowserAuthentication } from './browserSessionService';
import type {
  IdentityOptionsResponse,
  OidcStartResponse,
  OidcCompleteResponse,
  ExternalIdentityItem,
  PublicGoogleRegistrationPayload
} from '../types/oidc';

const transport = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000
});

export async function getIdentityOptions(): Promise<IdentityOptionsResponse> {
  const { data } = await transport.get<IdentityOptionsResponse>('/auth/identity-options', {
    headers: { 'Cache-Control': 'no-store' }
  });
  return data;
}

export async function startGoogleLogin(): Promise<OidcStartResponse> {
  const headers = await csrfHeaders();
  const { data } = await transport.post<OidcStartResponse>(
    '/auth/oidc/google/start',
    { purpose: 'LOGIN' },
    { headers }
  );
  return data;
}

export async function startGoogleInvitationAuth(): Promise<OidcStartResponse> {
  const headers = await csrfHeaders();
  const { data } = await transport.post<OidcStartResponse>(
    '/auth/oidc/google/start',
    { purpose: 'INVITATION' },
    { headers }
  );
  return data;
}

export async function completeGoogleAuth(): Promise<OidcCompleteResponse> {
  const headers = await csrfHeaders();
  const { data } = await transport.post<OidcCompleteResponse>(
    '/auth/oidc/google/complete',
    {},
    { headers }
  );
  return data;
}

export async function startGoogleLink(): Promise<OidcStartResponse> {
  const headers = await csrfHeaders();
  const { data } = await api.post<OidcStartResponse>(
    '/profile/external-identities/google/link/start',
    {},
    { headers }
  );
  return data;
}

export async function confirmGoogleLink(linkToken: string): Promise<ExternalIdentityItem> {
  const headers = await csrfHeaders();
  const { data } = await api.post<ExternalIdentityItem>(
    '/profile/external-identities/google/link/confirm',
    { linkToken },
    { headers }
  );
  return data;
}

export async function getMyExternalIdentities(): Promise<ExternalIdentityItem[]> {
  const { data } = await api.get<ExternalIdentityItem[]>('/profile/external-identities', {
    headers: { 'Cache-Control': 'no-store' }
  });
  return data;
}

export async function unlinkExternalIdentity(reference: string): Promise<void> {
  const headers = await csrfHeaders();
  await api.delete(`/profile/external-identities/${reference}`, { headers });
}

export async function setupInitialPassword(newPassword: string): Promise<void> {
  const headers = await csrfHeaders();
  await api.post('/profile/password/setup', { newPassword }, { headers });
}

export async function registerGoogle(payload: PublicGoogleRegistrationPayload): Promise<BrowserAuthentication> {
  const headers = await csrfHeaders();
  const { data } = await transport.post<BrowserAuthentication>(
    '/public/registrations/google',
    payload,
    { headers }
  );
  return data;
}

