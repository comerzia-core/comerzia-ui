// src/features/employees/services/employeeService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type {
  EmployeeSummaryResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeCreatedResponse,
  RoleResponse,
  EmployeeDetailResponse
} from '../types/employee';

export const employeeService = {
  getAll: async (page: number, size: number, sort?: string[]): Promise<PageResponse<EmployeeSummaryResponse>> => {
    const params: Record<string, any> = { page, size };
    if (sort && sort.length > 0) {
      params.sort = sort;
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

  getRoles: async (): Promise<RoleResponse[]> => {
    const response = await api.get<RoleResponse[]>('/roles');
    return response.data;
  }
};
