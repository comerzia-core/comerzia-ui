import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import type { SaleResponse, CustomerProfileResponse, SellerResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCancel, BtnModalYes } from '../../../components/ui/CrudButtons';
import { SaleDetailsModal } from '../components/SaleDetailsModal';
import { RegisterSaleCustomerModal } from '../components/RegisterSaleCustomerModal';
import { formatDateForUser } from '../../../utils/date';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import {
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  UserCheck,
  UserPlus,
  History,
  Search,
  Calendar,
  User,
  Building2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from 'lucide-react';

export const SalesHistoryPage = () => {
  const navigate = useNavigate();
  const { userProfile, hasPermission, hasRole } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const { options: dictOptions } = useLoadDictionaries([DICTIONARIES.PAYMENT_TYPE]);
  const paymentTypeOptions = dictOptions[DICTIONARIES.PAYMENT_TYPE] || [];

  const getPaymentTypeLabel = (type: number): string => {
    const found = paymentTypeOptions.find(opt => String(opt.value) === String(type));
    if (found) return found.label;
    if (type === 701) return 'Efectivo';
    if (type === 702) return 'Transferencia / QR';
    if (type === 703) return 'Tarjeta Débito / Crédito';
    return `Método (${type})`;
  };

  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Rol Owner
  const isOwner = hasRole('OWNER');

  // Permisos requeridos
  const canCancel = hasPermission('SAL_SALES_CANCEL') || hasRole('OWNER') || hasRole('ADMIN');
  const canReturn = hasPermission('SAL_RETURNS_MANAGE') || hasRole('OWNER') || hasRole('ADMIN');
  const canManageSales = hasPermission('SAL_SALES_MANAGE') || hasRole('OWNER') || hasRole('ADMIN');
  
  // Permisos para búsqueda con filtros (SAL_SALES_READ_ALL y SAL_SELLERS_READ)
  const hasReadAllPermission = hasPermission('SAL_SALES_READ_ALL') || hasRole('OWNER') || hasRole('ADMIN');
  const hasSellersPermission = hasPermission('SAL_SELLERS_READ') || hasRole('OWNER') || hasRole('ADMIN');
  const canFilter = hasReadAllPermission && hasSellersPermission;

  // Función utilitaria para obtener fecha local actual (YYYY-MM-DD)
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Lista de vendedores disponibles para el filtro
  const [sellers, setSellers] = useState<SellerResponse[]>([]);

  // Estados de Filtro (por defecto la fecha actual en ambos)
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [selectedSeller, setSelectedSeller] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<{
    startDate?: string;
    endDate?: string;
    sellerUsername?: string;
  } | null>(null);

  // Paginación Server-Side (Spring Boot 0-indexed)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estado del Menú Contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered: boolean;
    sale: SaleResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    sale: null
  });

  // Modal de Detalle de Venta
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<SaleResponse | null>(null);

  // Modal de Detalles del Cliente y Asignación de Cliente
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerProfileResponse | null>(null);
  const [assigningCustomerSale, setAssigningCustomerSale] = useState<SaleResponse | null>(null);

  // Estados de Cancelación
  const [cancelingSaleId, setCancelingSaleId] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

  // 1. Cargar vendedores si tiene los permisos correspondientes
  useEffect(() => {
    if (canFilter) {
      salesService.getSellers()
        .then(data => setSellers(data || []))
        .catch(err => console.error('Error loading sellers list:', err));
    }
  }, [canFilter]);

  // 2. Cargar ventas cuando cambian los parámetros de paginación
  useEffect(() => {
    loadSales(page, size, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const loadSales = async (
    targetPage = page,
    targetSize = size,
    activeFilters = appliedFilters
  ) => {
    setIsLoading(true);
    const isFiltering = canFilter && activeFilters !== null;

    try {
      if (isFiltering) {
        if (activeFilters.startDate && activeFilters.endDate && activeFilters.startDate > activeFilters.endDate) {
          toastError("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");
          setIsLoading(false);
          return;
        }

        const res = await salesService.searchSales({
          startDate: activeFilters.startDate || undefined,
          endDate: activeFilters.endDate || undefined,
          sellerUsername: activeFilters.sellerUsername || undefined,
          page: targetPage,
          size: targetSize
        });

        setSales(res.content || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      } else {
        const res = await salesService.findSales(targetPage, targetSize);
        setSales(res.content || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      }
    } catch (e: any) {
      console.error('Error loading sales:', e);
      toastError(e.response?.data?.message || "Error al cargar las ventas.");
      setSales([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (startDate && endDate && startDate > endDate) {
      toastError("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");
      return;
    }
    const newFilters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sellerUsername: selectedSeller || undefined
    };
    setAppliedFilters(newFilters);
    setPage(0);
    loadSales(0, size, newFilters);
  };

  const getStatusCode = (status: number | { code: number; label: string } | undefined): number => {
    if (typeof status === 'number') return status;
    if (status && typeof status === 'object' && 'code' in status) return status.code;
    return 0;
  };

  // Ver detalles completos de la venta
  const handleViewDetails = (sale: SaleResponse) => {
    setSelectedSaleDetails(sale);
  };

  // Abrir Menú Contextual en PC (Clic Derecho con coordenadas)
  const handleContextMenu = (e: React.MouseEvent, sale: SaleResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      isCentered: false,
      sale
    });
  };

  // Abrir Menú Contextual en Móvil (Simple Tap centrado en pantalla)
  const handleMobileCardTap = (e: React.MouseEvent, sale: SaleResponse) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      isCentered: true,
      sale
    });
  };

  // Cancelar venta pendiente (601)
  const handleCancelSale = async () => {
    if (!cancelingSaleId) return;
    setIsCanceling(true);
    try {
      await salesService.cancelPendingSale(cancelingSaleId);
      toastSuccess("Venta pendiente cancelada y stock liberado correctamente.");
      setCancelingSaleId(null);
      loadSales(page, size);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Error al cancelar la venta.");
    } finally {
      setIsCanceling(false);
    }
  };

  // Badges de Estado (6 Estados Oficiales)
  const renderStatusBadge = (status: number | { code: number; label: string } | undefined) => {
    const code = getStatusCode(status);
    const label = typeof status === 'object' ? status.label : undefined;
    switch (code) {
      case 601:
        return <ComerziaBadge variant="warning" label={label || "PENDIENTE"} />;
      case 602:
        return <ComerziaBadge variant="success" label={label || "COMPLETADA"} />;
      case 603:
        return <ComerziaBadge variant="neutral" label={label || "CANCELADA"} />;
      case 604:
        return <ComerziaBadge variant="error" label={label || "ANULADA"} />;
      case 605:
        return <ComerziaBadge variant="info" label={label || "DEV. PARCIAL"} />;
      case 606:
        return <ComerziaBadge variant="secondary" label={label || "DEV. TOTAL"} />;
      default:
        return <ComerziaBadge variant="neutral" label={label || "DESCONOCIDO"} />;
    }
  };

  // Definición de Columnas de la Tabla Desktop
  const columns: Column<SaleResponse>[] = [
    {
      header: 'N° Venta',
      render: (row: SaleResponse) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold text-base-content">
            {row.saleNumber ? `#${row.saleNumber}` : '-'}
          </span>
          {row.customer && (
            <UserCheck size={15} className="text-primary shrink-0" />
          )}
        </div>
      )
    },
    isOwner && {
      header: 'Sucursal',
      render: (row: SaleResponse) => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/80">
          <Building2 size={13} className="text-primary/70 shrink-0" />
          <span className="truncate">{row.branchName || '-'}</span>
        </div>
      )
    },
    {
      header: 'Fecha y Hora',
      render: (row: SaleResponse) => (
        <span className="whitespace-nowrap text-xs text-base-content/80">
          {formatDateForUser(row.date)}
        </span>
      )
    },
    {
      header: 'Vendedor',
      render: (row: SaleResponse) => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/80 font-medium">
          <User size={13} className="text-primary/70 shrink-0" />
          <span className="truncate">{row.employeeName || '-'}</span>
        </div>
      )
    },
    {
      header: 'Cliente',
      render: (row: SaleResponse) => (
        <span className="text-xs text-base-content/80 truncate max-w-[160px] block">
          {row.customer?.fullName || row.customer?.firstName || (
            <span className="text-base-content/40 italic">Consumidor Final</span>
          )}
        </span>
      )
    },
    {
      header: 'Subtotal',
      render: (row: SaleResponse) => (
        <span className="font-mono text-xs text-base-content/70 whitespace-nowrap">
          {currency} {row.subtotalAmount.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Descuento',
      render: (row: SaleResponse) => (
        <span className={`font-mono text-xs whitespace-nowrap ${row.discountedAmount > 0 ? 'text-error font-semibold' : 'text-base-content/40'}`}>
          {row.discountedAmount > 0 ? `-${currency} ${row.discountedAmount.toFixed(2)}` : '0.00'}
        </span>
      )
    },
    {
      header: 'Total Cobro',
      render: (row: SaleResponse) => (
        <span className="font-mono font-bold text-success text-sm whitespace-nowrap">
          {currency} {row.totalAmount.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Tipo de Pago',
      render: (row: SaleResponse) => {
        if (!row.payments || row.payments.length === 0) {
          return <span className="text-base-content/30 text-xs">-</span>;
        }
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {row.payments.map((p, idx) => (
              <span
                key={p.id || idx}
                className="badge badge-sm badge-ghost bg-base-200/80 border border-base-300 text-base-content/80 text-[11px] font-semibold whitespace-nowrap"
              >
                {getPaymentTypeLabel(p.paymentType)}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Estado',
      render: (row: SaleResponse) => renderStatusBadge(row.saleStatus)
    }
  ].filter(Boolean) as Column<SaleResponse>[];

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages,
    onPageChange: (newPage) => setPage(newPage),
    onPageSizeChange: (newSize) => {
      setSize(newSize);
      setPage(0);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <History className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Seguimiento de Ventas
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              {canFilter
                ? 'Historial de ventas de la sucursal con filtros de búsqueda por rango de fechas y vendedor.'
                : 'Historial de ventas registradas en el turno de trabajo activo.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS (Solo visible si cuenta con SAL_SALES_READ_ALL y SAL_SELLERS_READ) */}
      {canFilter && (
        <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200 w-full">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-end w-full">
            {/* Fechas en la misma fila en mobile (grid-cols-2) y flex-1 en desktop */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-1">
              <ComerziaInput
                label="Fecha Desde"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <ComerziaInput
                label="Fecha Hasta"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {/* Selector de vendedor */}
            <div className="w-full lg:w-72 xl:w-80">
              <ComerziaSelect
                label="Vendedor"
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                options={[
                  { value: '', label: 'Todos los vendedores' },
                  ...sellers.map(s => ({
                    value: s.username,
                    label: `${s.fullName}`
                  }))
                ]}
              />
            </div>
            {/* Botones de acción */}
            <div className="flex items-center gap-2 shrink-0">
              <ComerziaButton
                variant="primary"
                label="Filtrar"
                icon={<Search size={16} />}
                onClick={handleApplyFilters}
                className="flex-1 lg:flex-initial"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. LISTADO DE VENTAS: TABLA EN PC Y CARDS EN MOBILE */}
      <div className="space-y-4 md:space-y-6 md:card md:bg-base-100 md:p-6 md:rounded-2xl md:shadow-xs md:border md:border-base-200 w-full">
        {/* Header descriptivo en PC */}
        <div className="hidden md:flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-base-content">
              Registro de Ventas
            </h2>
            <span className="badge badge-sm badge-neutral font-bold">
              {totalElements}
            </span>
          </div>
          <span className="text-xs text-base-content/50 italic">
            * Clic derecho sobre una fila para acceder al menú de opciones.
          </span>
        </div>

        {/* VISTA DESKTOP: TABLA */}
        <div className="hidden md:block">
          <ComerziaTable
            data={sales}
            columns={columns}
            isLoading={isLoading}
            pagination={pagination}
            showRowNumbers={true}
            onRowContextMenu={(e, row) => handleContextMenu(e, row)}
            rowClassName={() => 'hover:!bg-primary/10 transition-colors cursor-pointer'}
          />
        </div>

        {/* VISTA MOBILE: CARDS MINIMALISTAS */}
        <div className="block md:hidden space-y-2.5">
          {isLoading ? (
            <div className="py-10 text-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs text-base-content/50 mt-2">Cargando ventas...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-xs text-base-content/50 bg-base-100 rounded-2xl border border-base-200 shadow-xs">
              No se encontraron ventas registradas con los criterios especificados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sales.map((sale, index) => (
                <article
                  key={sale.id}
                  onClick={(e) => handleMobileCardTap(e, sale)}
                  className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2 select-none cursor-pointer hover:border-primary/40"
                >
                  {/* Fila 1: Numeración, N° Venta, Ícono Cliente y Estado */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-bold text-base-content/40 w-5 text-center shrink-0">
                        {page * size + index + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-base-content shrink-0">
                        {sale.saleNumber ? `#${sale.saleNumber}` : '-'}
                      </span>
                      {sale.customer && (
                        <UserCheck size={15} className="text-primary shrink-0" />
                      )}
                    </div>
                    <div className="shrink-0">
                      {renderStatusBadge(sale.saleStatus)}
                    </div>
                  </div>

                  {/* Fila 2: Vendedor / Cliente (Izquierda) y Total + Tipo de Pago (Derecha) */}
                  <div className="pl-7 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-base-content/70 truncate">
                        <User size={13} className="text-primary/70 shrink-0" />
                        <span className="truncate font-medium">{sale.employeeName || 'Cajero'}</span>
                      </div>
                      {sale.customer && (
                        <div className="flex items-center gap-1.5 text-base-content/60 text-[11px] truncate">
                          <UserCheck size={12} className="text-primary/70 shrink-0" />
                          <span className="truncate">{sale.customer.fullName || sale.customer.firstName}</span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-right">
                      {sale.payments && sale.payments.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {sale.payments.map((p, idx) => (
                            <span
                              key={p.id || idx}
                              className="badge badge-xs badge-ghost bg-base-200/80 border border-base-300 text-base-content/70 text-[10px] font-semibold whitespace-nowrap px-1.5 py-0.5"
                            >
                              {getPaymentTypeLabel(p.paymentType)}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="font-mono font-bold text-sm text-success shrink-0">
                        {currency} {sale.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Fila 3: Fecha y Sucursal si es Owner */}
                  <div className="pl-7 pt-1.5 border-t border-base-200/60 flex items-center justify-between text-[11px] text-base-content/50">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-base-content/40 shrink-0" />
                      <span>{formatDateForUser(sale.date)}</span>
                    </div>
                    {isOwner && sale.branchName && (
                      <div className="flex items-center gap-1 text-base-content/70 font-medium">
                        <Building2 size={12} className="text-primary/70 shrink-0" />
                        <span className="truncate max-w-[130px]">{sale.branchName}</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* PAGINACIÓN MOBILE EN UNA SOLA FILA */}
          {totalElements > 0 && (
            <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <span>Mostrar</span>
                  <select
                    value={size}
                    onChange={(e) => {
                      setSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="whitespace-nowrap">de {totalElements} registros</span>
                </div>
                <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                  Página {page + 1} de {Math.max(1, totalPages)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  aria-label="Primera página"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage(0)}
                  className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Página anterior"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage(Math.max(0, page - 1))}
                  className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Página siguiente"
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() => setPage(page + 1)}
                  className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Última página"
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() => setPage(totalPages - 1)}
                  className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>

      {/* MENÚ CONTEXTUAL (Clic derecho en Desktop / Tap centrado en Móvil) */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.sale && (
          <>
            <ContextMenuItem
              icon={Eye}
              label="Ver Detalles"
              onClick={() => {
                if (contextMenu.sale) {
                  handleViewDetails(contextMenu.sale);
                }
              }}
            />

            {/* Opciones de Cliente */}
            {contextMenu.sale.customer ? (
              <ContextMenuItem
                icon={UserCheck}
                label="Ver Detalles del Cliente"
                onClick={() => {
                  if (contextMenu.sale?.customer) {
                    setSelectedCustomerDetails(contextMenu.sale.customer);
                  }
                }}
              />
            ) : (
              canManageSales && getStatusCode(contextMenu.sale.saleStatus) === 602 && (
                <ContextMenuItem
                  icon={UserPlus}
                  label="Asignar Cliente"
                  onClick={() => {
                    if (contextMenu.sale) {
                      setAssigningCustomerSale(contextMenu.sale);
                    }
                  }}
                />
              )
            )}

            {/* Si la venta está PENDING (601) */}
            {getStatusCode(contextMenu.sale.saleStatus) === 601 && canManageSales && (
              <ContextMenuItem
                icon={Edit}
                label="Editar Venta Pendiente"
                onClick={() => {
                  if (contextMenu.sale) { navigate('/sales/new', { state: { editSale: contextMenu.sale } }); }
                }}
              />
            )}
            {getStatusCode(contextMenu.sale.saleStatus) === 601 && canCancel && (
              <ContextMenuItem
                icon={Trash2}
                label="Cancelar Venta"
                variant="error"
                onClick={() => {
                  if (contextMenu.sale) setCancelingSaleId(contextMenu.sale.id);
                }}
              />
            )}

            {/* Si la venta está COMPLETED (602) o PARTIALLY_REFUNDED (605) */}
            {(getStatusCode(contextMenu.sale.saleStatus) === 602 || getStatusCode(contextMenu.sale.saleStatus) === 605) && canReturn && (
              <ContextMenuItem
                icon={RotateCcw}
                label="Procesar Devolución"
                isExternalLink={!contextMenu.isCentered}
                onClick={() => {
                  if (contextMenu.sale?.saleNumber) {
                    const path = `/sales/returns/${encodeURIComponent(contextMenu.sale.saleNumber)}`;
                    setContextMenu(prev => ({ ...prev, isOpen: false }));
                    if (contextMenu.isCentered) {
                      navigate(path);
                    } else {
                      window.open(path, '_blank');
                    }
                  }
                }}
              />
            )}
          </>
        )}
      </ComerziaContextMenu>

      {/* MODAL DETALLES DE VENTA */}
      <SaleDetailsModal
        isOpen={!!selectedSaleDetails}
        onClose={() => setSelectedSaleDetails(null)}
        sale={selectedSaleDetails}
      />

      {/* MODAL DETALLES DEL CLIENTE ASIGNADO */}
      <ComerziaModal
        isOpen={!!selectedCustomerDetails}
        onClose={() => setSelectedCustomerDetails(null)}
        title="Perfil del Cliente"
        size="md"
      >
        {selectedCustomerDetails && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 bg-primary/10 rounded-xl border border-primary/20">
              <UserCheck className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-base text-base-content">
                  {selectedCustomerDetails.fullName || selectedCustomerDetails.firstName}
                </h3>
                <span className="text-xs text-base-content/60">
                  {selectedCustomerDetails.customerType === 612 ? 'Persona Jurídica (Empresa)' : 'Persona Natural'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-base-200/40 p-4 rounded-xl border border-base-200 text-xs">
              <div>
                <span className="text-base-content/50 block font-medium">Documento de Identidad</span>
                <span className="font-mono text-sm font-semibold text-base-content">{selectedCustomerDetails.documentNumber || '-'}</span>
              </div>
              <div>
                <span className="text-base-content/50 block font-medium">Teléfono / Celular</span>
                <span className="font-mono text-sm font-semibold text-base-content">{selectedCustomerDetails.phoneNumber || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-base-content/50 block font-medium">Correo Electrónico</span>
                <span className="text-sm text-base-content">{selectedCustomerDetails.email || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-base-200">
              <BtnCancel
                label="Cerrar"
                onClick={() => setSelectedCustomerDetails(null)}
                responsive={true}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        )}
      </ComerziaModal>

      {/* MODAL ASIGNAR CLIENTE A VENTA */}
      {assigningCustomerSale && (
        <RegisterSaleCustomerModal
          isOpen={!!assigningCustomerSale}
          onClose={() => setAssigningCustomerSale(null)}
          saleId={assigningCustomerSale.id}
          saleNumber={assigningCustomerSale.saleNumber}
          onSuccess={() => {
            loadSales(page, size);
            setAssigningCustomerSale(null);
          }}
        />
      )}

      {/* MODAL CONFIRMAR CANCELACIÓN (601 PENDING) */}
      <ComerziaModal
        isOpen={!!cancelingSaleId}
        onClose={() => setCancelingSaleId(null)}
        title="Confirmar Cancelación de Venta"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle size={32} />
            <p className="font-semibold text-lg">¿Estás seguro de cancelar esta venta?</p>
          </div>
          <p className="text-sm text-base-content/60">
            Esta acción abortará la venta pendiente y liberará de inmediato el stock retenido en el inventario.
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-3 border-t border-base-200">
            <BtnCancel onClick={() => setCancelingSaleId(null)} disabled={isCanceling} responsive={true} className="w-full sm:w-auto" />
            <BtnModalYes
              label="Sí, Cancelar Venta"
              onClick={handleCancelSale}
              isLoading={isCanceling}
              disabled={isCanceling}
              responsive={true}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </ComerziaModal>

    </div>
  );
};
