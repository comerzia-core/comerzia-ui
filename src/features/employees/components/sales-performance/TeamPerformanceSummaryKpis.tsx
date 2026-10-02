// src/features/employees/components/sales-performance/TeamPerformanceSummaryKpis.tsx
import React from 'react';
import type { TeamPerformanceSummaryResponse } from '../../types/salesPerformance';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Receipt,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';

interface Props {
  summary: TeamPerformanceSummaryResponse | null;
  isLoading: boolean;
  currencyCode: string;
}

export const TeamPerformanceSummaryKpis: React.FC<Props> = ({
  summary,
  isLoading,
  currencyCode
}) => {
  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="card bg-base-100 p-4 rounded-2xl border border-base-200 h-28 flex flex-col justify-between"
          >
            <div className="h-4 bg-base-300 rounded-md w-24" />
            <div className="h-7 bg-base-300 rounded-md w-36" />
            <div className="h-3 bg-base-300 rounded-md w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* KPI 1: Ventas Brutas y Netas del Equipo */}
      <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Ventas Brutas
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-base-content tracking-tight block truncate">
              {formatMoney(summary.totalTeamGrossSales)}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-base-200 text-[11px] text-base-content/60 flex items-center justify-between">
          <span>Venta Neta:</span>
          <span className="font-mono font-bold text-base-content">
            {formatMoney(summary.totalTeamNetSales)}
          </span>
        </div>
      </div>

      {/* KPI 2: Ganancia Real y Margen Comercial */}
      <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Ganancia Neta
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight block truncate">
              {formatMoney(summary.totalTeamNetProfit)}
            </span>
            <span
              className={`badge badge-sm font-mono font-bold text-[10px] ${
                summary.overallProfitMargin >= 30
                  ? 'badge-success text-white'
                  : summary.overallProfitMargin >= 15
                  ? 'badge-warning text-white'
                  : 'badge-error text-white'
              }`}
            >
              {Number(summary.overallProfitMargin).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-base-200 text-[11px] text-base-content/60 flex items-center justify-between">
          <span>Costo COGS:</span>
          <span className="font-mono text-base-content/70">
            {formatMoney(summary.totalTeamCostOfGoodsSold)}
          </span>
        </div>
      </div>

      {/* KPI 3: Descuentos Sacrificados */}
      <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Descuentos
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-amber-500 tracking-tight block truncate">
              {formatMoney(summary.totalTeamDiscounts)}
            </span>
            <span
              className={`badge badge-sm font-mono font-bold text-[10px] ${
                summary.overallDiscountRate > 12
                  ? 'badge-error text-white'
                  : summary.overallDiscountRate >= 5
                  ? 'badge-warning text-white'
                  : 'badge-success text-white'
              }`}
            >
              {Number(summary.overallDiscountRate).toFixed(1)}%
            </span>
          </div>
        </div>
        <span className="text-[11px] text-base-content/50 mt-1 block">
          Tasa promedio sobre venta
        </span>
      </div>

      {/* KPI 4: Volumen Operativo (Ventas y Unidades) */}
      <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Operaciones
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-base-content tracking-tight block">
              {summary.totalTeamTransactions}{' '}
              <span className="text-xs font-normal text-base-content/60 font-sans">
                ventas
              </span>
            </span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-base-200 text-[11px] text-base-content/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-1">
            <ShoppingBag size={12} className="text-sky-500" /> Unidades:
          </span>
          <span className="font-mono font-bold text-base-content">
            {summary.totalTeamUnitsSold} uds
          </span>
        </div>
      </div>

      {/* KPI 5: Devoluciones y Penalizaciones */}
      <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
              Devoluciones
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-rose-500 tracking-tight block truncate">
              {formatMoney(summary.totalTeamReturnedAmount)}
            </span>
            <span
              className={`badge badge-sm font-mono font-bold text-[10px] ${
                summary.overallReturnRate > 5
                  ? 'badge-error text-white'
                  : summary.overallReturnRate >= 3
                  ? 'badge-warning text-white'
                  : 'badge-ghost'
              }`}
            >
              {Number(summary.overallReturnRate).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-base-200 text-[11px] text-base-content/60 flex items-center justify-between">
          <span>Reclamos:</span>
          <span className="font-mono font-semibold text-rose-500">
            {summary.totalTeamReturnsCount} ops
          </span>
        </div>
      </div>
    </div>
  );
};
