// src/features/dashboard/components/BranchComparisonSection.tsx
import React from 'react';
import type { DashboardBranchSalesResponse } from '../types/dashboard';
import { ComerziaBarChart } from '../../../components/ui/charts';
import { Store, Receipt } from 'lucide-react';

interface Props {
  branches: DashboardBranchSalesResponse[];
  currencyCode: string;
  hasFinancialPermission: boolean;
}

export const BranchComparisonSection: React.FC<Props> = ({
  branches,
  currencyCode,
  hasFinancialPermission
}) => {
  if (!branches || branches.length === 0) return null;

  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Preparar series para ComerziaBarChart
  const chartSeries = [
    {
      dataKey: 'grossSales',
      name: 'Ventas Brutas',
      color: '#4f46e5' // Indigo
    }
  ];

  if (hasFinancialPermission) {
    chartSeries.push({
      dataKey: 'netProfit',
      name: 'Ganancia Neta',
      color: '#10b981' // Emerald
    });
  }

  return (
    <div className="card bg-base-100 p-4 sm:p-6 rounded-3xl border border-base-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Store size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-base-content">
              Comparativa por Sucursal
            </h3>
            <p className="text-xs text-base-content/60">
              Desglose de ingresos, operaciones y margen comercial por tienda activa.
            </p>
          </div>
        </div>

        <span className="badge badge-neutral font-mono text-xs px-2.5 py-1">
          {branches.length} {branches.length === 1 ? 'sucursal' : 'sucursales'}
        </span>
      </div>

      {/* Gráfico de Barras Comparativo */}
      {branches.length > 1 && (
        <div className="pt-2">
          <ComerziaBarChart
            data={branches.map(b => ({
              branchName: b.branchName,
              grossSales: b.grossSales,
              netProfit: b.netProfit ?? 0
            }))}
            xAxisDataKey="branchName"
            series={chartSeries}
            height={280}
            valueFormatter={val => formatMoney(val)}
          />
        </div>
      )}

      {/* Grid de Tarjetas de Cada Tienda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {branches.map(branch => (
          <div
            key={branch.branchId}
            className="p-4 rounded-2xl bg-base-200/30 border border-base-200 hover:border-primary/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-base-content truncate" title={branch.branchName}>
                  {branch.branchName}
                </span>
                <span className="badge badge-sm badge-ghost font-mono text-[10px] shrink-0">
                  {branch.branchCode}
                </span>
              </div>

              {/* Ventas */}
              <div className="mt-1">
                <span className="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold block">
                  Ventas Brutas
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-primary block">
                  {formatMoney(branch.grossSales)}
                </span>
              </div>
            </div>

            {/* Transacciones y Margen */}
            <div className="mt-3 pt-2.5 border-t border-base-200/80 flex items-center justify-between text-xs font-mono">
              <span className="inline-flex items-center gap-1 text-base-content/60">
                <Receipt size={12} />
                {branch.transactionsCount} tickets
              </span>

              {hasFinancialPermission && branch.marginPercentage !== null && (
                <span
                  className={`badge badge-xs text-[10px] font-bold ${
                    branch.marginPercentage >= 30
                      ? 'badge-success text-white'
                      : branch.marginPercentage >= 15
                      ? 'badge-warning text-white'
                      : 'badge-error text-white'
                  }`}
                >
                  {Number(branch.marginPercentage).toFixed(1)}% Margen
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
