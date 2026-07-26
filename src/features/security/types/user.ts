// src/features/security/types/user.ts

export interface UserResponse {
  id: string;
  fullName: string;
  username: string;
  statusTypeName: string;
  statusTypeCode: number;
  locked: boolean;
  disabled: boolean;
  lastLoginAt: string | null;
  deactivatedAt: string | null;
  roles: string[];
}

export interface UpdateUserAccessRequest {
  disabled: boolean;
  statusTypeCode?: number;
}

export interface UpdateUserRolesRequest {
  roleIds: string[];
}

export interface ResetPasswordResponse {
  username: string;
  temporaryPassword: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  permissions?: string[];
}
