// src/features/security/services/userService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type {
  UserResponse,
  UpdateUserAccessRequest,
  UpdateUserRolesRequest,
  ResetPasswordResponse,
  RoleResponse
} from '../types/user';

export const userService = {
  getTenantUsers: async (
    page: number,
    size: number,
    q?: string,
    branchId?: string
  ): Promise<PageResponse<UserResponse>> => {
    const params: Record<string, any> = { page, size };
    if (q) params.q = q;
    if (branchId) params.branchId = branchId;

    const response = await api.get<PageResponse<UserResponse>>('/tenant/users', {
      params
    });
    return response.data;
  },

  getTenantUserById: async (id: string): Promise<UserResponse> => {
    const response = await api.get<UserResponse>(`/tenant/users/${id}`);
    return response.data;
  },

  updateUserAccess: async (id: string, disabled: boolean): Promise<UserResponse> => {
    const payload: UpdateUserAccessRequest = { disabled };
    const response = await api.patch<UserResponse>(`/tenant/users/${id}/access`, payload);
    return response.data;
  },

  unlockUserAccount: async (id: string): Promise<void> => {
    await api.post(`/tenant/users/${id}/unlock`);
  },

  resetUserPassword: async (id: string): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>(`/tenant/users/${id}/reset-password`);
    return response.data;
  },

  updateUserRoles: async (id: string, roleIds: string[], branchId?: string | null): Promise<UserResponse> => {
    const payload: UpdateUserRolesRequest = {
      roleIds,
      ...(branchId ? { branchId } : {})
    };
    const response = await api.put<UserResponse>(`/tenant/users/${id}/roles`, payload);
    return response.data;
  },

  getAllRoles: async (): Promise<RoleResponse[]> => {
    const response = await api.get<RoleResponse[]>('/roles');
    return response.data;
  }
};
