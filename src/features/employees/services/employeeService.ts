// src/features/employees/services/employeeService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type {
  EmployeeSummaryResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateEmployeeRolesRequest,
  EmployeeCreatedResponse,
  RoleResponse,
  EmployeeDetailResponse
} from '../types/employee';

export const employeeService = {
  getAll: async (
    page: number = 0,
    size: number = 10,
    sort?: string[],
    q?: string,
    branchId?: string
  ): Promise<PageResponse<EmployeeSummaryResponse>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort && sort.length > 0) {
      sort.forEach(s => params.append('sort', s));
    }
    if (q && q.trim()) {
      params.append('q', q.trim());
    }
    if (branchId && branchId.trim()) {
      params.append('branchId', branchId.trim());
    }
    const response = await api.get<PageResponse<EmployeeSummaryResponse>>('/tenant/employees', { params });
    return response.data;
  },

  getById: async (id: string): Promise<EmployeeDetailResponse> => {
    const response = await api.get<EmployeeDetailResponse>(`/tenant/employees/${id}`);
    return response.data;
  },

  create: async (data: CreateEmployeeRequest): Promise<EmployeeCreatedResponse> => {
    console.log("DATA: ", data);
    const response = await api.post<EmployeeCreatedResponse>('/tenant/employees', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEmployeeRequest): Promise<EmployeeDetailResponse> => {
    const response = await api.put<EmployeeDetailResponse>(`/tenant/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tenant/employees/${id}`);
  },

  updateRoles: async (id: string, roleIds: string[], branchId?: string | null): Promise<EmployeeDetailResponse> => {
    const payload: UpdateEmployeeRolesRequest = {
      roleIds,
      branchId: branchId || null
    };
    const response = await api.put<EmployeeDetailResponse>(`/tenant/employees/${id}/roles`, payload);
    return response.data;
  },

  getRoles: async (): Promise<RoleResponse[]> => {
    const response = await api.get<RoleResponse[]>('/roles');
    return response.data;
  }
};
