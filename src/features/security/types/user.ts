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
  branchId?: string | null;
}

export interface ResetPasswordResponse {
  username: string;
  temporaryPassword: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPublic?: boolean;
  permissions?: string[];
}
