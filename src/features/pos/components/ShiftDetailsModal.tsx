import { useState, useEffect } from 'react';
import { posService } from '../services/posService';
import type { 
  ShiftCompleteReportResponse, 
  ShiftMovementReportResponse, 
  ShiftSalePaymentReportResponse,
  PageShiftSalePaymentReportResponse,
  ShiftPaymentReport 
} from '../types/pos';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import { formatDateForUser, formatTimeForUser } from '../../../utils/date';
import { 
  User, 
  Building2, 
  Monitor, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowLeftRight, 
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
}

type ActiveTab = 'movements' | 'sales';

export const ShiftDetailsModal = ({ isOpen, onClose, shiftId }: Props) => {
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';

  const [report, setReport] = useState<ShiftCompleteReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('movements');

  // Estados para pestaña de Ventas (carga bajo demanda / lazy loading)
  const [salesPage, setSalesPage] = useState<PageShiftSalePaymentReportResponse | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPageNumber, setSalesPageNumber] = useState(0);
  const [salesPageSize, setSalesPageSize] = useState(5);

  useEffect(() => {
    if (isOpen && shiftId) {
      setActiveTab('movements');
      setSalesPage(null);
      setSalesPageNumber(0);
      loadReportData();
    }
  }, [isOpen, shiftId]);

  // Cargar ventas únicamente cuando se activa la pestaña 'sales' o cambian sus parámetros de paginación
  useEffect(() => {
    if (isOpen && shiftId && activeTab === 'sales') {
      loadSales(salesPageNumber, salesPageSize);
    }
  }, [isOpen, shiftId, activeTab, salesPageNumber, salesPageSize]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const detailsData = await posService.getShiftDetails(shiftId);
      setReport(detailsData);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toastError("El turno solicitado no fue encontrado.");
      } else {
        toastError("Error al cargar los detalles del turno.");
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSales = async (page: number, size: number) => {
    setSalesLoading(true);
    try {
      const data = await posService.getShiftSales(shiftId, page, size);
      setSalesPage(data);
    } catch (err) {
      toastError("Error al cargar el listado de ventas del turno.");
    } finally {
      setSalesLoading(false);
    }
  };

  const renderMovementType = (movementType: { code?: number; label: string }) => {
    const isOutflow = movementType.code === 2 || movementType.label.toLowerCase().includes('egreso') || movementType.label.toLowerCase().includes('outflow');
    const isReturn = movementType.code === 3 || movementType.label.toLowerCase().includes('devoluc') || movementType.label.toLowerCase().includes('return');
    
    if (isOutflow) {
      return (
        <span className="flex items-center gap-1.5 font-medium text-error">
          <TrendingDown size={15} className="shrink-0" />
          <span>{movementType.label}</span>
        </span>
      );
    }
    if (isReturn) {
      return (
        <span className="flex items-center gap-1.5 font-medium text-warning">
          <RotateCcw size={15} className="shrink-0" />
          <span>{movementType.label}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 font-medium text-success">
        <TrendingUp size={15} className="shrink-0" />
        <span>{movementType.label}</span>
      </span>
    );
  };

  const paymentColumns: Column<ShiftPaymentReport>[] = [
    { header: 'Forma de Pago', render: row => row.paymentType.label },
    { header: 'Ventas', render: row => `${currency} ${row.salesAmount.toFixed(2)}` },
    { header: 'Devoluciones', render: row => `${currency} ${row.returnsAmount.toFixed(2)}` },
    { header: 'Esperado (Sistema)', render: row => `${currency} ${row.expectedAmount.toFixed(2)}` },
    { header: 'Contado (Cajero)', render: row => `${currency} ${row.countedAmount.toFixed(2)}` },
    { 
      header: 'Diferencia', 
      render: row => {
        const isDiff = row.differenceAmount !== 0;
        return (
          <span className={`font-bold ${isDiff ? (row.differenceAmount > 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
            {currency} {row.differenceAmount.toFixed(2)}
          </span>
        );
      }
    }
  ];

  const movementColumns: Column<ShiftMovementReportResponse & { id: number }>[] = [
    { header: 'Hora', render: row => formatTimeForUser(row.date) },
    { header: 'Tipo', render: row => renderMovementType(row.movementType) },
    { header: 'Forma de Pago', render: row => row.paymentType.label },
    { 
      header: 'Monto', 
      render: row => {
        const isOutflow = row.movementType.code === 2 || row.movementType.label.toLowerCase().includes('egreso');
        return (
          <span className={`font-bold font-mono ${isOutflow ? 'text-error' : 'text-success'}`}>
            {isOutflow ? '-' : '+'}{currency} {row.amount.toFixed(2)}
          </span>
        );
      }
    },
    { header: 'Observación', accessorKey: 'observation' },
  ];

  const salesColumns: Column<ShiftSalePaymentReportResponse & { id: string }>[] = [
    { 
      header: 'Nro. Venta', 
      render: row => <span className="font-semibold font-mono text-primary">{row.saleNumber}</span> 
    },
    { 
      header: 'Hora', 
      render: row => formatTimeForUser(row.date) 
    },
    { 
      header: 'Tipo de Pago', 
      render: row => row.paymentType?.label || '-' 
    },
    { 
      header: 'Monto', 
      render: row => {
        const netAmount = row.amount - (row.changeAmount || 0);
        return (
          <div>
            <span className="font-bold font-mono text-success">
              {currency} {netAmount.toFixed(2)}
            </span>
            {row.changeAmount > 0 && (
              <span className="block text-[10px] text-base-content/50 font-mono">
                Cambio: {currency} {row.changeAmount.toFixed(2)}
              </span>
            )}
          </div>
        );
      }
    },
    { header: 'Vendedor', render: row => row.sellerName || '-' },
  ];

  const salesPagination: TablePaginationConfig = {
    currentPage: salesPageNumber,
    pageSize: salesPageSize,
    totalElements: salesPage?.totalElements || 0,
    totalPages: salesPage?.totalPages || 1,
    onPageChange: (newPage) => setSalesPageNumber(newPage),
    onPageSizeChange: (newSize) => {
      setSalesPageSize(newSize);
      setSalesPageNumber(0);
    }
  };

  const movementsData = (report?.movements || []).map((m, index) => ({
    ...m,
    id: index
  }));

  const salesDataList = (salesPage?.content || []).map((s, index) => ({
    ...s,
    id: `${s.saleNumber}-${index}`
  }));

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reporte de Turno Caja ${report?.cashRegisterName || ''}`}
      size="xl"
      variant="view"
      actions={
        <div className="flex flex-row justify-end w-full">
          <BtnCancel label="Cerrar" onClick={onClose} responsive={false} className="w-full sm:w-auto" />
        </div>
      }
    >
      {isLoading || !report ? (
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="space-y-6 pt-2 w-full animate-fade-in">
          
          {/* SECCIÓN 1: CONTEXTO GENERAL Y ESTADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contexto */}
            <div className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-base-content/70 uppercase tracking-wider">Contexto del Turno</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Caja:</span>
                  <span className="font-bold text-base-content truncate">{report.cashRegisterName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Sucursal:</span>
                  <span className="text-base-content/80 truncate">{report.branchName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Cajero:</span>
                  <span className="text-base-content/80 truncate">{report.cashierName}</span>
                </div>
                {report.closedByName && (
                  <div className="flex items-center gap-2 pt-1 border-t border-base-200/50">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <span className="font-medium text-base-content w-20 shrink-0">Cerrado:</span>
                    <span className="text-base-content/80 truncate">{report.closedByName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tiempos y Estado */}
            <div className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-base-content/70 uppercase tracking-wider">Estado y Tiempos</h3>
                <StatusBadge
                  statusName={report.statusType.label}
                  statusCode={report.statusType.code}
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Apertura:</span>
                  <span className="font-bold text-base-content truncate">{formatDateForUser(report.openedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className={report.closedAt ? "text-primary shrink-0" : "text-success animate-pulse shrink-0"} />
                  <span className="font-medium text-base-content w-20 shrink-0">Cierre:</span>
                  <span className="text-base-content/80 truncate">
                    {report.closedAt ? formatDateForUser(report.closedAt) : 'En curso'}
                  </span>
                </div>
                {report.observation && (
                  <div className="mt-2 pt-2 border-t border-base-300">
                    <span className="block text-xs font-semibold text-base-content/60 mb-1">Observaciones de Cierre:</span>
                    <p className="text-sm italic text-base-content/80 bg-base-200/50 p-2 rounded-lg border border-base-300">
                      "{report.observation}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TOTALES GLOBALES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-base-100 shadow-sm border border-primary/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-1">Monto Inicial</span>
              <span className="text-xl sm:text-2xl font-bold text-primary font-mono">{currency} {report.initialAmount.toFixed(2)}</span>
            </div>
            <div className="bg-base-100 shadow-sm border border-success/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-success/70 uppercase tracking-wider mb-1">Total Ingresos</span>
              <span className="text-xl sm:text-2xl font-bold text-success font-mono">{currency} {report.totalInflows.toFixed(2)}</span>
            </div>
            <div className="bg-base-100 shadow-sm border border-error/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-error/70 uppercase tracking-wider mb-1">Total Egresos</span>
              <span className="text-xl sm:text-2xl font-bold text-error font-mono">{currency} {report.totalOutflows.toFixed(2)}</span>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLE POR MÉTODO DE PAGO */}
          <div className="space-y-3">
            <h3 className="font-bold text-base sm:text-lg border-b border-base-200 pb-2 text-base-content">
              Cuadre por Método de Pago
            </h3>
            {report.paymentReports.length === 0 ? (
              <p className="text-xs sm:text-sm text-base-content/60 italic">El turno aún está abierto o no tiene cuadre final.</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <ComerziaTable
                    data={report.paymentReports.map((p, index) => ({ ...p, id: index }))}
                    columns={paymentColumns}
                  />
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden space-y-2">
                  {report.paymentReports.map((p, idx) => {
                    const isDiff = p.differenceAmount !== 0;
                    return (
                      <div key={idx} className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-md space-y-3 text-xs hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-center font-bold pb-1 border-b border-base-200/50">
                          <span className="text-sm">{p.paymentType.label}</span>
                          <span className={`text-sm ${isDiff ? (p.differenceAmount > 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
                            Dif: {currency} {p.differenceAmount.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-base-200/40 p-1.5 rounded-lg flex justify-between">
                            <span className="text-base-content/60">Ventas:</span>
                            <span className="font-semibold">{currency} {p.salesAmount.toFixed(2)}</span>
                          </div>
                          <div className="bg-base-200/40 p-1.5 rounded-lg flex justify-between">
                            <span className="text-base-content/60">Devoluciones:</span>
                            <span className="font-semibold text-error">{currency} {p.returnsAmount.toFixed(2)}</span>
                          </div>
                          <div className="bg-primary/5 p-1.5 rounded-lg flex justify-between text-primary">
                            <span className="opacity-70">Sistema:</span>
                            <span className="font-bold">{currency} {p.expectedAmount.toFixed(2)}</span>
                          </div>
                          <div className="bg-success/5 p-1.5 rounded-lg flex justify-between text-success">
                            <span className="opacity-70">Contado:</span>
                            <span className="font-bold">{currency} {p.countedAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* SECCIÓN 4: PESTAÑAS (MOVIMIENTOS / VENTAS) */}
          <div className="space-y-4 pt-2">
            <div className="flex border-b border-base-200 gap-2">
              <button
                type="button"
                className={`pb-2.5 px-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'movements'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'
                }`}
                onClick={() => setActiveTab('movements')}
              >
                <ArrowLeftRight size={16} />
                <span>Movimientos</span>
                <span className="badge badge-sm badge-neutral">
                  {report.movements?.length ?? 0}
                </span>
              </button>

              <button
                type="button"
                className={`pb-2.5 px-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'sales'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'
                }`}
                onClick={() => setActiveTab('sales')}
              >
                <ShoppingBag size={16} />
                <span>Ventas</span>
                {salesPage !== null && (
                  <span className="badge badge-sm badge-neutral">
                    {salesPage.totalElements}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: MOVIMIENTOS */}
            {activeTab === 'movements' && (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <ComerziaTable
                    data={movementsData}
                    columns={movementColumns}
                    showRowNumbers={true}
                  />
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden space-y-2">
                  {movementsData.length === 0 ? (
                    <p className="text-xs text-base-content/50 italic py-4 text-center">
                      Sin movimientos registrados en este turno.
                    </p>
                  ) : (
                    movementsData.map((m) => {
                      const isOutflow = m.movementType.code === 2 || m.movementType.label.toLowerCase().includes('egreso');
                      return (
                        <div key={m.id} className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-md space-y-2 text-xs hover:border-primary/30 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                {renderMovementType(m.movementType)}
                                <span className="text-base-content/40">•</span>
                                <span className="text-[11px] font-medium text-base-content/60">{m.paymentType.label}</span>
                              </div>
                              <span className="text-[10px] text-base-content/50 block font-medium">
                                {formatTimeForUser(m.date)}
                              </span>
                            </div>
                            <span className={`font-bold font-mono text-sm ${isOutflow ? 'text-error' : 'text-success'}`}>
                              {isOutflow ? '-' : '+'}{currency} {m.amount.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[10px] text-base-content/60 italic mt-0.5">
                            {m.observation ? `"${m.observation}"` : <span className="text-base-content/40">(sin observación)</span>}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: VENTAS (PAGINADAS) */}
            {activeTab === 'sales' && (
              <div className="space-y-3">
                {salesLoading ? (
                  <div className="flex justify-center p-10 bg-base-100 rounded-xl shadow-xs border border-base-200">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <ComerziaTable
                        data={salesDataList}
                        columns={salesColumns}
                        pagination={salesPagination}
                        showRowNumbers={true}
                      />
                    </div>

                    {/* Mobile Cards */}
                    <div className="block md:hidden space-y-2">
                      {salesDataList.length === 0 ? (
                        <p className="text-xs text-base-content/50 italic py-4 text-center">
                          No se registraron ventas en este turno.
                        </p>
                      ) : (
                        salesDataList.map((sale) => {
                          const netAmount = sale.amount - (sale.changeAmount || 0);
                          return (
                            <div key={sale.id} className="bg-base-100 p-3 rounded-xl border border-base-300 shadow-md flex flex-col gap-1.5 hover:border-primary/30 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="font-bold font-mono text-base-content">{formatTimeForUser(sale.date)}</span>
                                <span className="font-bold font-mono text-success text-base">
                                  {currency} {netAmount.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-base-content/50 truncate max-w-[180px]">Vendedor: {sale.sellerName || 'Sistema'}</span>
                                <span className="badge badge-sm badge-primary badge-outline font-semibold">{sale.paymentType?.label || '-'}</span>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Paginación Mobile para Ventas */}
                      {salesPage && salesPage.totalPages > 1 && (
                        <div className="flex justify-between items-center px-1 pt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline gap-1"
                            disabled={salesPageNumber === 0 || salesLoading}
                            onClick={() => setSalesPageNumber(prev => Math.max(0, prev - 1))}
                          >
                            <ChevronLeft size={14} />
                            Ant.
                          </button>
                          <span className="text-xs font-semibold text-base-content/70">
                            Pág. {salesPageNumber + 1} de {salesPage.totalPages}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline gap-1"
                            disabled={salesPageNumber >= salesPage.totalPages - 1 || salesLoading}
                            onClick={() => setSalesPageNumber(prev => prev + 1)}
                          >
                            Sig.
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

        </div>
      )}
    </ComerziaModal>
  );
};

