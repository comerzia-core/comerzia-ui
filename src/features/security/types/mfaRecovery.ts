export type MfaEmergencyRequestStatus = 'REQUESTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED' | 'EXPIRED';

export interface MfaEmergencyRequestResponse {
  publicReference: string;
  status: MfaEmergencyRequestStatus;
  reason: string;
  rejectionReason: string | null;
  expiresAt: string;
  createdAt: string;
  executedAt: string | null;
  rejectedAt: string | null;

}

export interface CreateMfaEmergencyRequest {
  reason: string;
}

export interface RejectMfaEmergencyRequest {
  reason: string;
}

