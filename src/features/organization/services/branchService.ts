// src/features/organization/services/branchService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type { BranchResponse, CreateBranchRequest, UpdateBranchRequest } from '../types/branch';

export const branchService = {
  getBranches: async (page: number, size: number, onlyActive = false): Promise<PageResponse<BranchResponse>> => {
    const response = await api.get<PageResponse<BranchResponse>>('/tenant/branches', {
      params: { page, size, onlyActive }
    });
    return response.data;
  },

  createBranch: async (data: CreateBranchRequest): Promise<BranchResponse> => {
    const response = await api.post<BranchResponse>('/tenant/branches', data);
    return response.data;
  },

  updateBranch: async (id: string, data: UpdateBranchRequest): Promise<BranchResponse> => {
    const response = await api.put<BranchResponse>(`/tenant/branches/${id}`, data);
    return response.data;
  },

  deleteBranch: async (id: string): Promise<void> => {
    await api.delete(`/tenant/branches/${id}`);
  }
};