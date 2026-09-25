import type { DictionaryResponse } from '../../../types/dictionary';

export interface MyProfileResponse {
  id: string;
  username: string;
  status: string;
  roles: string[];
  companyName: string;
  branchId: string;
  branchName: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  documentType: DictionaryResponse | null;
  documentNumber: string | null;
  documentExtension: DictionaryResponse | null;
  address: string | null;
  imageUrl: string | null;
}

export interface UpdateMyProfileRequest {
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  email?: string;
  phoneNumber?: string;
  documentType?: number | null;
  documentNumber?: string;
  documentExtension?: number | null;
  address?: string;
  imageUrl?: string | null;
}

export interface ChangeMyPasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const PROFILE_ERROR_CODES = {
  INVALID_CURRENT_PASSWORD: 'invalid_current_password',
  PASSWORD_MISMATCH: 'password_mismatch',
  SAME_PASSWORD: 'same_password',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  USER_NOT_FOUND: 'user_not_found'
} as const;
