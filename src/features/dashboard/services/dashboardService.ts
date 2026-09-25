// src/features/dashboard/services/dashboardService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type {
  DashboardSummaryResponse,
  DashboardSummaryParams,
  DashboardSellerRankingResponse,
  DashboardSellerRankingParams,
  DashboardSellerPersonalResponse,
  DashboardPersonalParams
} from '../types/dashboard';

export const dashboardService = {
  /**
   * Obtiene el resumen ejecutivo con KPIs, tendencia de ventas y desglose por tienda.
   */
  getDashboardSummary: async (params?: DashboardSummaryParams): Promise<DashboardSummaryResponse> => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId.trim()) {
      query.append('branchId', params.branchId.trim());
    }
    if (params?.period) {
      query.append('period', params.period);
    }
    if (params?.startDate && params.startDate.trim()) {
      query.append('startDate', params.startDate.trim());
    }
    if (params?.endDate && params.endDate.trim()) {
      query.append('endDate', params.endDate.trim());
    }

    const response = await api.get<DashboardSummaryResponse>(
      `/tenant/dashboard/summary${query.toString() ? `?${query.toString()}` : ''}`
    );
    return response.data;
  },

  /**
   * Obtiene la tabla/leaderboard paginado de vendedores con métricas de ventas y rentabilidad.
   */
  getSellerRanking: async (
    params?: DashboardSellerRankingParams
  ): Promise<PageResponse<DashboardSellerRankingResponse>> => {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId.trim()) {
      query.append('branchId', params.branchId.trim());
    }
    if (params?.period) {
      query.append('period', params.period);
    }
    if (params?.startDate && params.startDate.trim()) {
      query.append('startDate', params.startDate.trim());
    }
    if (params?.endDate && params.endDate.trim()) {
      query.append('endDate', params.endDate.trim());
    }
    if (params?.sortBy) {
      query.append('sortBy', params.sortBy);
    }
    if (params?.page !== undefined) {
      query.append('page', String(params.page));
    }
    if (params?.size !== undefined) {
      query.append('size', String(params.size));
    }

    const response = await api.get<PageResponse<DashboardSellerRankingResponse>>(
      `/tenant/dashboard/seller-ranking${query.toString() ? `?${query.toString()}` : ''}`
    );
    return response.data;
  },

  /**
   * Obtiene las estadísticas individuales del vendedor autenticado y su posición en el ranking general.
   */
  getMyStats: async (params?: DashboardPersonalParams): Promise<DashboardSellerPersonalResponse> => {
    const query = new URLSearchParams();
    if (params?.period) {
      query.append('period', params.period);
    }
    if (params?.startDate && params.startDate.trim()) {
      query.append('startDate', params.startDate.trim());
    }
    if (params?.endDate && params.endDate.trim()) {
      query.append('endDate', params.endDate.trim());
    }

    const response = await api.get<DashboardSellerPersonalResponse>(
      `/tenant/dashboard/my-stats${query.toString() ? `?${query.toString()}` : ''}`
    );
    return response.data;
  }
};
