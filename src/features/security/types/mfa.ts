export interface MfaStatusResponse {
  configured: boolean;
  factorType: string | null;
  status: 'ACTIVE' | 'PENDING' | 'NOT_CONFIGURED';
  enrolledAt: string | null;
  pending: boolean;
  pendingExpiresAt: string | null;
  recoveryCodesRemaining: number;
}

export interface TotpEnrollmentStartResponse {
  secret: string;
  otpauthUri: string;
  expiresAt: string;
  digits: number;
  period: number;
  algorithm: string;
  issuer: string;
  account: string;
}

export interface ConfirmTotpEnrollmentRequest {
  code: string;
}

export interface TotpEnrollmentConfirmResponse {
  status: string;
  recoveryCodes: string[];
  message: string;
  token?: string;
  sessionId?: string;
}

export interface MfaStepUpRequest {
  code: string;
  action: string;
  targetId?: string | null;
}

export interface MfaStepUpResponse {
  grantToken: string;
  expiresAt: string;
  action: string;
}

export type MfaStepUpActionType =
  | 'ASSIGN_ROLES'
  | 'UPDATE_USER_ACCESS'
  | 'MANAGE_SAAS_TEAM'
  | 'DEACTIVATE_MFA'
  | 'REGENERATE_RECOVERY_CODES'
  | 'REPLACE_MFA'
  | 'ADMIN_MFA_RECOVERY'
  | 'UPDATE_SECURITY_SETTINGS';
