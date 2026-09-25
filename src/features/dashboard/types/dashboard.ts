// src/features/dashboard/types/dashboard.ts

export type DashboardPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';
export type DashboardSellerSort = 'SALES' | 'PROFIT' | 'TRANSACTIONS';

export interface DashboardKpisResponse {
  totalGrossSales: number;
  totalNetProfit: number | null; // null si no tiene COM_DASHBOARD_FINANCIAL_READ
  totalDiscounts: number;
  totalTransactions: number;
  averageTicket: number;
  marginPercentage: number | null; // null si no tiene COM_DASHBOARD_FINANCIAL_READ
  totalUnitsSold: number;
}

export interface DashboardTrendResponse {
  dateGroup: string; // "14:00" en TODAY, o "2026-09-24" en WEEK/MONTH, o "2026-09" en YEAR
  grossSales: number;
  netProfit: number | null;
  transactionsCount: number;
}

export interface DashboardBranchSalesResponse {
  branchId: string;
  branchName: string;
  branchCode: string;
  grossSales: number;
  netProfit: number | null;
  transactionsCount: number;
  marginPercentage: number | null;
}

export interface DashboardSummaryResponse {
  kpis: DashboardKpisResponse;
  salesTrend: DashboardTrendResponse[];
  branchSales: DashboardBranchSalesResponse[];
}

export interface DashboardSellerRankingResponse {
  position: number;
  employeeId: string;
  sellerName: string;
  photoUrl: string | null;
  totalGrossSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalDiscounts: number;
  totalUnitsSold: number;
  netProfit: number | null; // null si no tiene COM_DASHBOARD_FINANCIAL_READ
  marginPercentage: number | null; // null si no tiene COM_DASHBOARD_FINANCIAL_READ
}

export interface DashboardSellerPersonalResponse {
  employeeId: string;
  sellerName: string;
  grossSales: number;
  transactions: number;
  averageTicket: number;
  totalDiscounts: number;
  unitsSold: number;
  rankingPosition: number; // Ej: 2
  totalSellers: number; // Ej: 6 (Puesto 2 de 6)
}

export interface DashboardSummaryParams {
  branchId?: string;
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export interface DashboardSellerRankingParams {
  branchId?: string;
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
  sortBy?: DashboardSellerSort;
  page?: number;
  size?: number;
}

export interface DashboardPersonalParams {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}
