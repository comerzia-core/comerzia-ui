export type EmailVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
export type EmailDeliveryState = 'NOT_REQUESTED' | 'UNAVAILABLE' | 'SUPPRESSED' | 'QUEUED' | 'SENDING' | 'ACCEPTED' | 'SEND' | 'DELIVERED' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'BOUNCED' | 'SOFT_BOUNCE' | 'COMPLAINED' | 'REJECTED' | 'DELAYED';

export interface EmailVerificationStatusResponse {
  email: string | null;
  status: EmailVerificationStatus;
  verifiedAt: string | null;
  requestedAt: string | null;
  canRequest: boolean;
  cooldownSecondsRemaining: number;
  deliveryState: EmailDeliveryState;
}

export interface EmailVerificationRequestResponse {
  queued: boolean;
  code: 'QUEUED' | 'COOLDOWN' | 'ALREADY_VERIFIED';
  message: string;
  cooldownSeconds: number;
}

export interface PublicChallengeInspectionResponse {
  valid: boolean;
  status: string; // PENDING, CONSUMED, EXPIRED, CANCELLED, INVALID
  maskedEmail: string | null;
  message: string;
}

export interface PublicChallengeConfirmationResponse {
  success: boolean;
  status: string;
  message: string;
}

