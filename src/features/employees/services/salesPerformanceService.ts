// src/features/employees/services/salesPerformanceService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type {
  SellerPerformanceAuditResponse,
  TeamPerformanceSummaryResponse,
  SellerPerformanceDetailResponse,
  SalesPerformanceFilterParams
} from '../types/salesPerformance';

export const salesPerformanceService = {
  /**
   * Obtiene la tabla paginada de auditoría de rendimiento de vendedores
   */
  getPerformanceAudit: async (
    params: SalesPerformanceFilterParams
  ): Promise<PageResponse<SellerPerformanceAuditResponse>> => {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }
    if (params.branchId && params.branchId.trim()) {
      queryParams.append('branchId', params.branchId.trim());
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params.search && params.search.trim()) {
      queryParams.append('search', params.search.trim());
    }
    if (params.sort && params.sort.length > 0) {
      params.sort.forEach(s => queryParams.append('sort', s));
    }

    const response = await api.get<PageResponse<SellerPerformanceAuditResponse>>(
      '/tenant/hr/sales-performance',
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Obtiene el resumen consolidado de métricas de desempeño del equipo comercial
   */
  getTeamSummary: async (params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TeamPerformanceSummaryResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.branchId && params.branchId.trim()) {
      queryParams.append('branchId', params.branchId.trim());
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const response = await api.get<TeamPerformanceSummaryResponse>(
      '/tenant/hr/sales-performance/summary',
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Obtiene la radiografía detallada de productos y tiendas de un colaborador
   */
  getSellerDetail: async (
    employeeId: string,
    params?: {
      branchId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<SellerPerformanceDetailResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.branchId && params.branchId.trim()) {
      queryParams.append('branchId', params.branchId.trim());
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const response = await api.get<SellerPerformanceDetailResponse>(
      `/tenant/hr/sales-performance/${employeeId}/details`,
      { params: queryParams }
    );
    return response.data;
  }
};
