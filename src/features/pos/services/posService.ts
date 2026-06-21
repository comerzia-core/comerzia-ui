import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
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
  getCashiers: async (): Promise<EmployeePosResponse[]> => {
    const response = await api.get<EmployeePosResponse[]>('/tenant/employees/cashiers');
    return response.data;
  },

  // --- Cajas Registradoras ---
  getAllCashRegisters: async (page: number, size: number): Promise<PageCashRegisterResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    const response = await api.get<PageCashRegisterResponse>('/tenant/cash-registers', { params });
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

  getShiftShiftsByCashRegister: async (registerId: string, page: number, size: number): Promise<PageShiftResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    const response = await api.get<PageShiftResponse>(`/tenant/cash-registers/${registerId}/shifts`, { params });
    return response.data;
  },

  openShift: async (data: OpenShiftRequest): Promise<ShiftResponse> => {
    const response = await api.post<ShiftResponse>('/tenant/shifts/open', data);
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
  getMovements: async (page: number, size: number, shiftId?: string): Promise<PageMovementResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (shiftId) {
      params.append('shiftId', shiftId);
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
