export interface EmailChangeRequestDto {
  newEmail: string;
  currentPassword: string;
}

export interface EmailChangeInspectRequestDto {
  token: string;
}

export interface EmailChangeConfirmRequestDto {
  token: string;
}

export interface EmailChangeResponse {
  success: boolean;
  message: string;
  pendingEmail?: string;
}

export interface EmailChangeInspectionResponse {
  valid: boolean;
  status: string;
  maskedEmail?: string;
  message?: string;
}

export interface PendingEmailChangeResponse {
  hasPending: boolean;
  pendingEmail?: string;
  requestedAt?: string;
  expiresAt?: string;
}
