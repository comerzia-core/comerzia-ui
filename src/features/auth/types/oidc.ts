export interface IdentityOptionsResponse {
  googleOidcEnabled: boolean;
}

export interface OidcStartResponse {
  authorizationUrl: string;
  state: string;
}

export type OidcCompleteStatus =
  | 'AUTHENTICATED'
  | 'MFA_PENDING'
  | 'MFA_ENROLLMENT_REQUIRED'
  | 'RECOVERY_RESTRICTED'
  | 'ACCOUNT_LINK_REQUIRED'
  | 'REGISTRATION_REQUIRED'
  | 'LINK_VERIFIED'
  | 'REAUTH_VERIFIED';

export interface OidcAuthData {
  token?: string;
  sessionId?: string;
  expiresAt?: string;
  absoluteExpiresAt?: string;
  idleSeconds?: number;
  mfaRequired?: boolean;
  mfaType?: string;
  authenticationState?: string;
  role?: string;
  companyId?: string;
  csrfToken?: string;
}

export interface OidcCompleteResponse {
  status: OidcCompleteStatus;
  code?: string;
  message?: string;
  purpose?: string;
  email?: string;
  name?: string;
  registrationToken?: string;
  linkToken?: string;
  auth?: OidcAuthData;
}

export interface ExternalIdentityItem {
  publicReference: string;
  provider: string;
  emailAtLink: string;
  linkedAt: string;
  status: boolean;
}

export interface PublicGoogleRegistrationPayload {
  registrationToken: string;
  username: string;
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  commercialName: string;
  branchName: string;
  requestKey: string;
}

