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

  // Renderizador del contenido interno de cada tarjeta de sucursal
  const renderBranchContent = (branch: DashboardBranchSalesResponse) => (
    <>
      <div>
        {/* Cabecera de la sucursal con ícono destacado y código */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
              <Store size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm text-base-content truncate block leading-tight" title={branch.branchName}>
                {branch.branchName}
              </span>
              <span className="text-[10px] font-mono text-base-content/50 block">
                {branch.branchCode}
              </span>
            </div>
          </div>
        </div>

        {/* Métricas destacadas en cajitas con contraste */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* Ventas Brutas */}
          <div className="p-2.5 rounded-xl bg-base-100 border border-base-200/90 shadow-2xs">
            <span className="text-[10px] text-base-content/50 uppercase tracking-wider font-bold block">
              Ventas Brutas
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-primary block truncate mt-0.5">
              {formatMoney(branch.grossSales)}
            </span>
          </div>

          {/* Ganancia Neta o Operaciones */}
          {hasFinancialPermission && branch.netProfit !== null && branch.netProfit !== undefined ? (
            <div className="p-2.5 rounded-xl bg-base-100 border border-base-200/90 shadow-2xs">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold block">
                Ganancia Neta
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">
                {formatMoney(branch.netProfit)}
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-base-100 border border-base-200/90 shadow-2xs">
              <span className="text-[10px] text-base-content/50 uppercase tracking-wider font-bold block">
                Operaciones
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-base-content block truncate mt-0.5">
                {branch.transactionsCount} ventas
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transacciones y Margen en footer */}
      <div className="mt-3.5 pt-2.5 border-t border-base-300/60 flex items-center justify-between text-xs font-mono">
        <span className="inline-flex items-center gap-1.5 text-base-content/60 font-medium">
          <Receipt size={13} className="text-base-content/40" />
          {branch.transactionsCount} ventas
        </span>

        {hasFinancialPermission && branch.marginPercentage !== null && (
          <span
            className={`badge badge-xs text-[10px] font-bold py-1 px-2 ${
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
    </>
  );

  return (
    <div className="space-y-3 sm:space-y-0">
      {/* Card Maestra: Cabecera, Gráfico de Barras y Grid en Desktop/Tablet */}
      <div className="card bg-base-100 p-4 sm:p-6 rounded-3xl border border-base-200 shadow-xs space-y-5 sm:space-y-6">
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

          <span className="badge badge-neutral font-mono text-xs px-2.5 py-1 self-start sm:self-auto">
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

        {/* Separador y subtítulo para el desglose en Desktop */}
        <div className="hidden sm:flex items-center justify-between pt-4 border-t border-base-200">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-primary" />
            <h4 className="text-xs font-bold text-base-content uppercase tracking-wider">
              Desglose Individual por Tienda
            </h4>
          </div>
          <span className="text-[11px] font-mono text-base-content/50">
            {branches.length} {branches.length === 1 ? 'sucursal activa' : 'sucursales activas'}
          </span>
        </div>

        {/* Grid de Tarjetas de Cada Tienda (Solo Desktop / Tablet dentro de la card maestra, con alto contraste) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {branches.map(branch => (
            <div
              key={branch.branchId}
              className="p-4 sm:p-4.5 rounded-2xl bg-base-200/70 hover:bg-base-200 border border-base-300/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              {renderBranchContent(branch)}
            </div>
          ))}
        </div>
      </div>

      {/* Listado en Mobile: Tarjetas independientes listadas debajo de la card maestra */}
      <div className="sm:hidden space-y-3">
        <div className="px-1 pt-1">
          <h4 className="text-xs font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1.5">
            <Store size={14} className="text-primary" />
            Detalle por Sucursal
          </h4>
        </div>
        {branches.map(branch => (
          <div
            key={branch.branchId}
            className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between group"
          >
            {renderBranchContent(branch)}
          </div>
        ))}
      </div>
    </div>
  );
};
