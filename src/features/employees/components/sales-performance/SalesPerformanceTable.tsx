// src/features/employees/components/sales-performance/SalesPerformanceTable.tsx
import React from 'react';
import type { SellerPerformanceAuditResponse } from '../../types/salesPerformance';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../../components/ui/ComerziaTable';
import { ComerziaButton } from '../../../../components/ui/ComerziaButton';
import {
  Store,
  Receipt,
  Activity,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from 'lucide-react';

interface Props {
  data: SellerPerformanceAuditResponse[];
  isLoading: boolean;
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
  currencyCode: string;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onRowContextMenu: (e: React.MouseEvent, item: SellerPerformanceAuditResponse) => void;
  onMobileCardTap: (e: React.MouseEvent, item: SellerPerformanceAuditResponse) => void;
  onViewDetails: (item: SellerPerformanceAuditResponse) => void;
}

export const SalesPerformanceTable: React.FC<Props> = ({
  data,
  isLoading,
  totalElements,
  totalPages,
  page,
  pageSize,
  currencyCode,
  onPageChange,
  onPageSizeChange,
  onRowContextMenu,
  onMobileCardTap,
  onViewDetails
}) => {
  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper para badge de tasa de descuento
  const renderDiscountRateBadge = (rate: number) => {
    if (rate > 12.0) {
      return (
        <span className="badge badge-error text-white font-mono font-bold text-[10px] py-1 px-1.5" title="Descuento Excesivo">
          {Number(rate).toFixed(1)}% Excesivo
        </span>
      );
    }
    if (rate >= 5.0) {
      return (
        <span className="badge badge-warning text-white font-mono font-bold text-[10px] py-1 px-1.5" title="Precaución">
          {Number(rate).toFixed(1)}% Precaución
        </span>
      );
    }
    return (
      <span className="badge badge-success text-white font-mono font-bold text-[10px] py-1 px-1.5" title="Sano">
        {Number(rate).toFixed(1)}% Sano
      </span>
    );
  };

  // Helper para badge de margen de ganancia
  const renderProfitMarginBadge = (margin: number) => {
    if (margin >= 30.0) {
      return (
        <span className="badge badge-success text-white font-mono font-bold text-[10px] py-1 px-1.5">
          {Number(margin).toFixed(1)}%
        </span>
      );
    }
    if (margin >= 15.0) {
      return (
        <span className="badge badge-warning text-white font-mono font-bold text-[10px] py-1 px-1.5">
          {Number(margin).toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="badge badge-error text-white font-mono font-bold text-[10px] py-1 px-1.5">
        {Number(margin).toFixed(1)}%
      </span>
    );
  };

  // Helper para badge de tasa de devoluciones
  const renderReturnRateBadge = (rate: number) => {
    if (rate > 5.0) {
      return (
        <span className="badge badge-error text-white font-mono font-bold text-[10px] py-1 px-1.5">
          {Number(rate).toFixed(1)}% Alto
        </span>
      );
    }
    if (rate >= 3.0) {
      return (
        <span className="badge badge-warning text-white font-mono font-bold text-[10px] py-1 px-1.5">
          {Number(rate).toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="badge badge-ghost font-mono text-base-content/60 text-[10px] py-1 px-1.5">
        {Number(rate).toFixed(1)}%
      </span>
    );
  };

  // Configuración de columnas para ComerziaTable (Desktop)
  const columns: Column<SellerPerformanceAuditResponse & { id: string }>[] = [
    {
      header: 'Vendedor',
      className: 'min-w-[200px]',
      render: item => (
        <div className="flex items-center gap-3">
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.sellerName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-base-300 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {item.sellerName
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-base-content block truncate" title={item.sellerName}>
                {item.sellerName}
              </span>
              {!item.isActive && (
                <span className="badge badge-error text-white text-[9px] font-bold px-1.5 py-0.5">
                  Baja
                </span>
              )}
            </div>
            <span className="text-[11px] text-base-content/60 flex items-center gap-1 mt-0.5 truncate font-medium">
              <Store size={11} className="text-primary/70 shrink-0" />
              {item.baseBranchName || 'Sin sucursal base'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Venta Bruta',
      className: 'text-right font-mono font-bold',
      render: item => (
        <div className="text-right">
          <span className="text-sm font-bold font-mono text-primary block">
            {formatMoney(item.grossSales)}
          </span>
          <span className="text-[10px] text-base-content/50 font-sans block">
            {item.totalTransactions} ventas
          </span>
        </div>
      )
    },
    {
      header: 'Descuentos',
      className: 'text-right',
      render: item => (
        <div className="text-right space-y-0.5">
          <span className="text-xs font-mono font-bold text-amber-500 block">
            {formatMoney(item.totalDiscounts)}
          </span>
          <div>{renderDiscountRateBadge(item.averageDiscountRate)}</div>
        </div>
      )
    },
    {
      header: 'Venta Neta',
      className: 'text-right font-mono font-bold',
      render: item => (
        <span className="text-sm font-bold font-mono text-base-content block text-right">
          {formatMoney(item.netSales)}
        </span>
      )
    },
    {
      header: 'Costo (COGS)',
      className: 'text-right font-mono',
      render: item => (
        <span className="text-xs font-mono text-base-content/60 block text-right">
          {formatMoney(item.costOfGoodsSold)}
        </span>
      )
    },
    {
      header: 'Ganancia Neta',
      className: 'text-right',
      render: item => (
        <div className="text-right">
          <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block">
            {formatMoney(item.netProfit)}
          </span>
        </div>
      )
    },
    {
      header: 'Margen %',
      className: 'text-center',
      render: item => (
        <div className="text-center">
          {renderProfitMarginBadge(item.profitMargin)}
        </div>
      )
    },
    {
      header: 'Ventas / Ops',
      className: 'text-center',
      render: item => (
        <div className="text-center font-mono text-xs">
          <span className="font-bold text-base-content block">
            {item.totalTransactions} ops
          </span>
          <span className="text-[10px] text-base-content/50 block font-sans">
            Venta Prom.: {formatMoney(item.averageTicket)}
          </span>
        </div>
      )
    },
    {
      header: 'Devoluciones',
      className: 'text-right',
      render: item => (
        <div className="text-right space-y-0.5">
          <span className="text-xs font-mono font-semibold text-rose-500 block">
            {formatMoney(item.returnedAmount)}
          </span>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[10px] text-base-content/50">
              {item.returnsCount} ops •
            </span>
            {renderReturnRateBadge(item.returnRate)}
          </div>
        </div>
      )
    },
    {
      header: 'Acciones',
      className: 'text-center w-28',
      render: item => (
        <div className="flex items-center justify-center">
          <ComerziaButton
            variant="ghost"
            icon={<Activity size={14} className="text-primary" />}
            label="Radiografía"
            onClick={() => onViewDetails(item)}
            className="btn-xs rounded-xl min-w-0"
            tooltip="Ver desglose detallado de ventas"
          />
        </div>
      )
    }
  ];

  // Configuración de paginación para ComerziaTable
  const paginationConfig: TablePaginationConfig = {
    totalElements,
    totalPages,
    currentPage: page,
    pageSize,
    onPageChange,
    onPageSizeChange
  };

  // Data formateada con id para ComerziaTable
  const tableData = data.map(item => ({
    ...item,
    id: item.employeeId
  }));

  return (
    <div>
      {/* 1. VISTA PC/DESKTOP (md:block) */}
      <div className="hidden md:block">
        <ComerziaTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          showRowNumbers={true}
          pagination={paginationConfig}
          onRowContextMenu={(e, row) => onRowContextMenu(e, row)}
        />
      </div>

      {/* 2. VISTA MOBILE: CARDS INDIVIDUALES (block md:hidden) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-base-content/50 bg-base-200/50 rounded-2xl text-xs">
            No se encontraron vendedores en el período seleccionado.
          </div>
        ) : (
          data.map((item, index) => (
            <article
              key={item.employeeId}
              onClick={e => onMobileCardTap(e, item)}
              className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-3 select-none cursor-pointer"
            >
              {/* FILA SUPERIOR: NUMERACIÓN, AVATAR, NOMBRE Y BADGE */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                    {page * pageSize + index + 1}
                  </span>
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.sellerName}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-base-300 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {item.sellerName
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-base-content leading-tight truncate">
                      {item.sellerName}
                    </h3>
                    <p className="text-[11px] text-base-content/60 flex items-center gap-1 mt-0.5 truncate">
                      <Store size={11} className="text-primary/70 shrink-0" />
                      {item.baseBranchName || 'Sin sucursal'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.isActive ? (
                    <span className="badge badge-success text-white text-[10px] font-bold py-0.5 px-2">
                      Activo
                    </span>
                  ) : (
                    <span className="badge badge-error text-white text-[10px] font-bold py-0.5 px-2">
                      Baja
                    </span>
                  )}
                </div>
              </div>

              {/* CAJAS DE MÉTRICAS CLAVE */}
              <div className="grid grid-cols-2 gap-2 pl-6">
                {/* Venta Bruta y Neta */}
                <div className="p-2.5 rounded-xl bg-base-200/50 border border-base-200">
                  <span className="text-[10px] text-base-content/50 uppercase font-bold block">
                    Venta Bruta
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-primary block truncate">
                    {formatMoney(item.grossSales)}
                  </span>
                  <span className="text-[10px] font-mono text-base-content/60 block mt-0.5">
                    Neta: {formatMoney(item.netSales)}
                  </span>
                </div>

                {/* Ganancia Neta y Margen */}
                <div className="p-2.5 rounded-xl bg-base-200/50 border border-base-200">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                    Ganancia Real
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block truncate">
                    {formatMoney(item.netProfit)}
                  </span>
                  <div className="mt-0.5">{renderProfitMarginBadge(item.profitMargin)}</div>
                </div>

                {/* Descuentos Otorgados */}
                <div className="p-2.5 rounded-xl bg-base-200/50 border border-base-200">
                  <span className="text-[10px] text-amber-500 uppercase font-bold block">
                    Descuentos
                  </span>
                  <span className="text-xs font-bold font-mono text-amber-500 block truncate">
                    {formatMoney(item.totalDiscounts)}
                  </span>
                  <div className="mt-0.5">{renderDiscountRateBadge(item.averageDiscountRate)}</div>
                </div>

                {/* Devoluciones */}
                <div className="p-2.5 rounded-xl bg-base-200/50 border border-base-200">
                  <span className="text-[10px] text-rose-500 uppercase font-bold block">
                    Devoluciones
                  </span>
                  <span className="text-xs font-bold font-mono text-rose-500 block truncate">
                    {formatMoney(item.returnedAmount)}
                  </span>
                  <div className="mt-0.5">{renderReturnRateBadge(item.returnRate)}</div>
                </div>
              </div>

              {/* PIE DE TARJETA CON VENTAS Y BOTÓN DE RADIOGRAFÍA */}
              <div className="pl-6 pt-2 border-t border-base-200 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-base-content/60 font-mono text-[11px]">
                  <Receipt size={12} className="text-primary/70 shrink-0" />
                  {item.totalTransactions} ventas • {item.totalUnitsSold} uds
                </span>

                <ComerziaButton
                  variant="ghost"
                  icon={<Activity size={13} className="text-primary" />}
                  label="Radiografía"
                  onClick={e => {
                    e.stopPropagation();
                    onViewDetails(item);
                  }}
                  className="btn-xs rounded-lg min-w-0"
                />
              </div>
            </article>
          ))
        )}

        {/* 3. PAGINACIÓN MOBILE EN UNA SOLA FILA */}
        {totalPages > 0 && (
          <footer
            className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs"
            data-purpose="mobile-pagination"
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span>Mostrar</span>
                <select
                  value={pageSize}
                  onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="whitespace-nowrap">de {totalElements}</span>
              </div>
              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                Página {page + 1} de {Math.max(1, totalPages)}
              </span>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                aria-label="Primera página"
                disabled={page === 0 || isLoading}
                onClick={() => onPageChange(0)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 0 || isLoading}
                onClick={() => onPageChange(Math.max(0, page - 1))}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => onPageChange(page + 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Última página"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => onPageChange(totalPages - 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
