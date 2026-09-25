// src/features/employees/components/sales-performance/SellerRadiographyModal.tsx
import React, { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { BtnCancel } from '../../../../components/ui/CrudButtons';
import { salesPerformanceService } from '../../services/salesPerformanceService';
import type { SellerPerformanceDetailResponse } from '../../types/salesPerformance';
import { ComerziaBarChart } from '../../../../components/ui/charts';
import {
  Store,
  Package,
  Receipt,
  UserCheck,
  UserX
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  currencyCode: string;
}

export const SellerRadiographyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employeeId,
  startDate,
  endDate,
  branchId,
  currencyCode
}) => {
  const [detail, setDetail] = useState<SellerPerformanceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'branches'>('products');

  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    if (isOpen && employeeId) {
      loadSellerDetail(employeeId);
    } else {
      setDetail(null);
      setActiveTab('products');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeId, startDate, endDate, branchId]);

  const loadSellerDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await salesPerformanceService.getSellerDetail(id, {
        startDate,
        endDate,
        branchId
      });
      setDetail(data);
    } catch (err) {
      console.error('Error loading seller radiography detail:', err);
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const chartSeries = [
    {
      dataKey: 'grossSales',
      name: 'Ventas Brutas',
      color: '#4f46e5' // Indigo
    },
    {
      dataKey: 'netProfit',
      name: 'Ganancia Neta',
      color: '#10b981' // Emerald
    }
  ];

  if (!isOpen) return null;

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-bold text-base sm:text-lg text-base-content">
            Radiografía de Desempeño Comercial
          </span>
        </div>
      }
      size="xl"
      variant="view"
      actions={
        <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
          <BtnCancel onClick={onClose} label="Cerrar" responsive={false} className="w-full sm:w-auto" />
        </div>
      }
    >
      {isLoading || !detail ? (
        <div className="flex flex-col justify-center items-center h-80 gap-3">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-xs text-base-content/60">
            Cargando desglose de productos y sucursales del colaborador...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cabecera del Colaborador */}
          <div className="card bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {detail.photoUrl ? (
                <img
                  src={detail.photoUrl}
                  alt={detail.sellerName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                  {detail.sellerName
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-base-content leading-tight">
                    {detail.sellerName}
                  </h3>
                  {detail.isActive ? (
                    <span className="badge badge-success text-white font-bold gap-1 text-[11px] px-2 py-1">
                      <UserCheck size={12} />
                      Activo
                    </span>
                  ) : (
                    <span className="badge badge-error text-white font-bold gap-1 text-[11px] px-2 py-1">
                      <UserX size={12} />
                      Inactivo / Baja
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-base-content/60 mt-1">
                  <Store size={13} className="text-primary" />
                  <span>Sucursal Base:</span>
                  <strong className="text-base-content font-medium">
                    {detail.baseBranchName || 'No asignada'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Pestañas internas */}
            <div className="flex items-center gap-1 bg-base-200 p-1 rounded-xl self-start sm:self-center">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-base-100 text-primary shadow-xs'
                    : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                <Package size={14} />
                <span>Top Productos ({detail.topProducts?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('branches')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'branches'
                    ? 'bg-base-100 text-primary shadow-xs'
                    : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                <Store size={14} />
                <span>Desglose Tiendas ({detail.branchBreakdown?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Top Productos Vendidos */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-1.5">
                    <Package size={16} className="text-primary" />
                    Productos con Mayor Desempeño Comercial
                  </h4>
                  <p className="text-xs text-base-content/60">
                    Artículos vendidos por este colaborador durante el periodo seleccionado.
                  </p>
                </div>
              </div>

              {!detail.topProducts || detail.topProducts.length === 0 ? (
                <div className="card bg-base-100 p-10 text-center border border-base-200 rounded-2xl text-xs text-base-content/50">
                  No se registraron ventas de productos en este periodo.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-xs">
                  <table className="table table-sm text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-base-200/50 text-base-content/70">
                        <th className="whitespace-nowrap">Producto</th>
                        <th className="text-center whitespace-nowrap">Cant.</th>
                        <th className="text-right whitespace-nowrap">Venta Bruta</th>
                        <th className="text-right whitespace-nowrap">Descuentos</th>
                        <th className="text-right whitespace-nowrap">Venta Neta</th>
                        <th className="text-right whitespace-nowrap">Costo</th>
                        <th className="text-right whitespace-nowrap">Ganancia</th>
                        <th className="text-center whitespace-nowrap">Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.topProducts.map(prod => (
                        <tr key={prod.variantId} className="hover:bg-base-200/30 transition-colors">
                          <td className="whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.productName}
                                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-base-300 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-base-content/40 shrink-0">
                                  <Package size={14} />
                                </div>
                              )}
                              <div className="min-w-0 max-w-[220px]">
                                <span className="font-bold text-base-content block truncate" title={prod.productName}>
                                  {prod.productName}
                                </span>
                                {prod.variantName && (
                                  <span className="text-[10px] text-base-content/60 block truncate">
                                    {prod.variantName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center font-mono font-bold whitespace-nowrap">
                            {prod.quantitySold} uds
                          </td>
                          <td className="text-right font-mono font-semibold text-primary whitespace-nowrap">
                            {formatMoney(prod.grossSales)}
                          </td>
                          <td className="text-right font-mono text-amber-500 whitespace-nowrap">
                            {formatMoney(prod.discounts)}
                          </td>
                          <td className="text-right font-mono font-bold text-base-content whitespace-nowrap">
                            {formatMoney(prod.netSales)}
                          </td>
                          <td className="text-right font-mono text-base-content/60 whitespace-nowrap">
                            {formatMoney(prod.cost)}
                          </td>
                          <td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {formatMoney(prod.netProfit)}
                          </td>
                          <td className="text-center whitespace-nowrap">
                            <span
                              className={`badge badge-xs text-[10px] font-bold font-mono py-1 px-1.5 ${
                                prod.profitMargin >= 30
                                  ? 'badge-success text-white'
                                  : prod.profitMargin >= 15
                                  ? 'badge-warning text-white'
                                  : 'badge-error text-white'
                              }`}
                            >
                              {Number(prod.profitMargin).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Desglose Multitienda */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-1.5">
                    <Store size={16} className="text-primary" />
                    Distribución de Ventas por Sucursal
                  </h4>
                  <p className="text-xs text-base-content/60">
                    Compara el aporte comercial del colaborador entre las distintas tiendas de la empresa.
                  </p>
                </div>
              </div>

              {!detail.branchBreakdown || detail.branchBreakdown.length === 0 ? (
                <div className="card bg-base-100 p-10 text-center border border-base-200 rounded-2xl text-xs text-base-content/50">
                  No hay transacciones por sucursal registradas para este colaborador.
                </div>
              ) : (
                <>
                  {/* Gráfico comparativo si vendió en más de 1 sucursal */}
                  {detail.branchBreakdown.length > 1 && (
                    <div className="card bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-xs">
                      <ComerziaBarChart
                        data={detail.branchBreakdown.map(b => ({
                          branchName: b.branchName,
                          grossSales: b.grossSales,
                          netProfit: b.netProfit
                        }))}
                        xAxisDataKey="branchName"
                        series={chartSeries}
                        height={240}
                        valueFormatter={val => formatMoney(val)}
                      />
                    </div>
                  )}

                  {/* Cuadrícula de tarjetas de cada sucursal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {detail.branchBreakdown.map(b => (
                      <div
                        key={b.branchId}
                        className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-sm text-base-content truncate" title={b.branchName}>
                              {b.branchName}
                            </span>
                            <span className="badge badge-sm badge-ghost font-mono text-[10px]">
                              {b.branchCode}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="p-2 rounded-xl bg-base-200/50">
                              <span className="text-[10px] text-base-content/50 uppercase font-bold block">
                                Ventas
                              </span>
                              <span className="text-xs sm:text-sm font-bold font-mono text-primary block truncate">
                                {formatMoney(b.grossSales)}
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-base-200/50">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                                Ganancia
                              </span>
                              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 block truncate">
                                {formatMoney(b.netProfit)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-base-200 flex items-center justify-between text-xs font-mono">
                          <span className="inline-flex items-center gap-1 text-base-content/60">
                            <Receipt size={12} />
                            {b.transactionsCount} tickets
                          </span>

                          <span
                            className={`badge badge-xs text-[10px] font-bold ${
                              b.profitMargin >= 30
                                ? 'badge-success text-white'
                                : b.profitMargin >= 15
                                ? 'badge-warning text-white'
                                : 'badge-error text-white'
                            }`}
                          >
                            {Number(b.profitMargin).toFixed(1)}% Margen
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </ComerziaModal>
  );
};
