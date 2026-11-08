// src/features/employees/types/invitation.ts

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface TenantEmployeeInvitationResponse {
  publicReference: string;
  email: string;
  roleCode: number;
  roleName: string;
  branchId: string | null;
  branchName: string | null;
  status: InvitationStatus;
  expiresAt: string;
  generation: number;
  createdAt?: string | null;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  deliveryStatus?: string | null;
}

export interface CreateTenantInvitationRequest {
  email: string;
  roleCode?: number;
  roleIds?: string[];
  branchId?: string | null;
  employeeId?: string | null;
  requestKey?: string;
}

export interface RevokeInvitationRequest {
  reason: string;
}

export interface InspectInvitationRequest {
  token: string;
}

export interface InspectInvitationResponse {
  publicReference: string;
  emailMasked: string;
  companyName: string;
  roleName: string;
  branchName: string | null;
  expiresAt: string;
  status: string;
}

export interface AcceptInvitationRequest {
  token: string;
  method: 'PASSWORD' | 'GOOGLE';
  username?: string | null;
  password?: string | null;
  firstName?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  googleContinuationToken?: string | null;
}

export interface AcceptInvitationResponse {
  publicReference: string;
  status: string;
  email: string;
  username: string;
  companyName: string;
  roleName: string;
  auth: {
    token?: string;
    sessionId?: string;
    expiresAt?: string;
    absoluteExpiresAt?: string;
    idleSeconds?: number;
    mfaRequired?: boolean;
    mfaType?: string;
    authenticationState?: string;
  };
}

