import api from '../../../lib/axios';
import type {
  EmployeePosResponse,
  CashRegisterResponse,
  PageCashRegisterResponse,
  CreateCashRegisterRequest,
  UpdateCashRegisterRequest,
  ShiftResponse,
  PageShiftResponse,
  ShiftSummaryResponse,
  OpenShiftRequest,
  CloseShiftRequest,
  ShiftDetailResponse,
  MovementResponse,
  PageMovementResponse,
  CreateMovementRequest,
  UpdateMovementRequest
} from '../types/pos';

export const posService = {
  // --- Cajeros ---
  getCashiers: async (branchId?: string): Promise<EmployeePosResponse[]> => {
    const headers: Record<string, string> = {};
    if (branchId) {
      headers['X-Branch-Context'] = branchId;
    }
    const response = await api.get<EmployeePosResponse[]>('/tenant/employees/cashiers', { headers });
    return response.data;
  },

  // --- Cajas Registradoras ---
  getAllCashRegisters: async (
    page: number = 0,
    size: number = 100,
    sort: string[] = [],
    status?: boolean,
    availableOnly?: boolean,
    branchId?: string
  ): Promise<PageCashRegisterResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort && sort.length > 0) {
      sort.forEach(s => params.append('sort', s));
    }
    if (status !== undefined) {
      params.append('status', status.toString());
    }
    if (availableOnly !== undefined) {
      params.append('availableOnly', availableOnly.toString());
    }
    const headers: Record<string, string> = {};
    if (branchId) {
      headers['X-Branch-Context'] = branchId;
    }
    const response = await api.get<PageCashRegisterResponse>('/tenant/cash-registers', { params, headers });
    return response.data;
  },

  getCashRegisterById: async (id: string): Promise<CashRegisterResponse> => {
    const response = await api.get<CashRegisterResponse>(`/tenant/cash-registers/${id}`);
    return response.data;
  },

  createCashRegister: async (data: CreateCashRegisterRequest): Promise<CashRegisterResponse> => {
    const response = await api.post<CashRegisterResponse>('/tenant/cash-registers', data);
    return response.data;
  },

  updateCashRegister: async (id: string, data: UpdateCashRegisterRequest): Promise<CashRegisterResponse> => {
    const response = await api.put<CashRegisterResponse>(`/tenant/cash-registers/${id}`, data);
    return response.data;
  },

  // --- Turnos ---
  getMyActiveShiftSummary: async (): Promise<ShiftSummaryResponse> => {
    const response = await api.get<ShiftSummaryResponse>('/tenant/shifts/my-active-summary');
    return response.data;
  },

  getAllActiveShiftSummaries: async (): Promise<ShiftSummaryResponse[]> => {
    const response = await api.get<ShiftSummaryResponse[]>('/tenant/shifts/active-summaries');
    return response.data;
  },

  getActiveShiftsByBranch: async (branchId: string): Promise<ShiftSummaryResponse[]> => {
    const response = await api.get<ShiftSummaryResponse[]>('/tenant/shifts/active-by-branch', {
      params: { branchId }
    });
    return response.data;
  },

  getShiftsByCashRegister: async (registerId: string, page: number, size: number, sort: string[] = []): Promise<PageShiftResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort && sort.length > 0) {
      sort.forEach(s => params.append('sort', s));
    }
    const response = await api.get<PageShiftResponse>(`/tenant/cash-registers/${registerId}/shifts`, { params });
    return response.data;
  },

  getShiftDetails: async (shiftId: string): Promise<ShiftDetailResponse[]> => {
    const response = await api.get<ShiftDetailResponse[]>(`/tenant/cash-registers/shifts/${shiftId}/details`);
    return response.data;
  },

  openShift: async (data: OpenShiftRequest, branchId?: string): Promise<ShiftResponse> => {
    const headers: Record<string, string> = {};
    if (branchId) {
      headers['X-Branch-Context'] = branchId;
    }
    const response = await api.post<ShiftResponse>('/tenant/shifts/open', data, { headers });
    return response.data;
  },

  closeShift: async (id: string, data: CloseShiftRequest): Promise<ShiftResponse> => {
    const response = await api.post<ShiftResponse>(`/tenant/shifts/${id}/close`, data);
    return response.data;
  },

  reopenShift: async (id: string): Promise<ShiftResponse> => {
    const response = await api.post<ShiftResponse>(`/tenant/shifts/${id}/reopen`);
    return response.data;
  },

  // --- Movimientos ---
  getMovements: async (page: number, size: number, shiftId?: string, activeOnly?: boolean): Promise<PageMovementResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (shiftId) {
      params.append('shiftId', shiftId);
    }
    if (activeOnly) {
      params.append('activeOnly', 'true');
    }
    const response = await api.get<PageMovementResponse>('/tenant/movements', { params });
    return response.data;
  },

  createMovement: async (data: CreateMovementRequest): Promise<MovementResponse> => {
    const response = await api.post<MovementResponse>('/tenant/movements', data);
    return response.data;
  },

  updateMovement: async (id: string, data: UpdateMovementRequest): Promise<MovementResponse> => {
    const response = await api.put<MovementResponse>(`/tenant/movements/${id}`, data);
    return response.data;
  },

  deleteMovement: async (id: string): Promise<void> => {
    await api.delete(`/tenant/movements/${id}`);
  }
};
