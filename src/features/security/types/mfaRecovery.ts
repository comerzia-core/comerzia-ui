export type MfaEmergencyRequestStatus = 'REQUESTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED' | 'EXPIRED';

export interface MfaEmergencyRequestResponse {
  id: string;
  userId: string;
  requestedByUserId: string;
  approvedByUserId: string | null;
  executedByUserId: string | null;
  status: MfaEmergencyRequestStatus;
  reason: string;
  rejectionReason: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateMfaEmergencyRequest {
  reason: string;
}

export interface RejectMfaEmergencyRequest {
  reason: string;
}

