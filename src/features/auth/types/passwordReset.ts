export interface PasswordResetRequestDto {
  email: string;
}

export interface PasswordResetInspectRequestDto {
  token: string;
}

export interface PasswordResetConfirmRequestDto {
  token: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetInspectionResponse {
  valid: boolean;
  status: string;
  maskedEmail?: string;
  message?: string;
}
