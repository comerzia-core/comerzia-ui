// src/features/employees/types/salesPerformance.ts

/**
 * Respuesta del endpoint de auditoría de rendimiento comercial de un vendedor
 */
export interface SellerPerformanceAuditResponse {
  employeeId: string;
  sellerName: string;
  photoUrl: string | null;
  baseBranchName: string;
  isActive: boolean;

  // Ventas y Descuentos
  grossSales: number;
  totalDiscounts: number;
  averageDiscountRate: number; // Porcentaje (ej: 5.00)
  netSales: number;

  // Rentabilidad
  costOfGoodsSold: number;
  netProfit: number;
  profitMargin: number; // Porcentaje (ej: 36.84)

  // Desempeño Operativo
  totalTransactions: number;
  averageTicket: number;
  totalUnitsSold: number;

  // Devoluciones / Penalizaciones
  returnsCount: number;
  returnedAmount: number;
  returnRate: number; // Porcentaje respecto a netSales (ej: 1.26)
}

/**
 * Respuesta de resumen de métricas consolidadas del equipo comercial
 */
export interface TeamPerformanceSummaryResponse {
  totalTeamGrossSales: number;
  totalTeamDiscounts: number;
  overallDiscountRate: number; // Porcentaje
  totalTeamNetSales: number;
  totalTeamCostOfGoodsSold: number;
  totalTeamNetProfit: number;
  overallProfitMargin: number; // Porcentaje
  totalTeamTransactions: number;
  totalTeamUnitsSold: number;
  totalTeamReturnsCount: number;
  totalTeamReturnedAmount: number;
  overallReturnRate: number; // Porcentaje
}

/**
 * Detalle de producto vendido por un colaborador
 */
export interface SellerProductDetailResponse {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string | null;
  quantitySold: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  cost: number;
  netProfit: number;
  profitMargin: number; // Porcentaje
}

/**
 * Desglose de ventas por sucursal de un colaborador
 */
export interface SellerBranchBreakdownResponse {
  branchId: string;
  branchName: string;
  branchCode: string;
  grossSales: number;
  netSales: number;
  netProfit: number;
  transactionsCount: number;
  profitMargin: number; // Porcentaje
}

/**
 * Radiografía completa / Detalle individual de un vendedor
 */
export interface SellerPerformanceDetailResponse {
  employeeId: string;
  sellerName: string;
  photoUrl: string | null;
  baseBranchName: string;
  isActive: boolean;
  topProducts: SellerProductDetailResponse[];
  branchBreakdown: SellerBranchBreakdownResponse[];
}

/**
 * Parámetros de consulta y filtrado para la auditoría de ventas
 */
export interface SalesPerformanceFilterParams {
  branchId?: string;
  startDate?: string; // Formato ISO YYYY-MM-DD
  endDate?: string;   // Formato ISO YYYY-MM-DD
  search?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/**
 * Tipos de periodos rápidos preestablecidos
 */
export type SalesPerformancePeriod =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM';
