import { useEffect, useState } from 'react';
import { posService } from '../services/posService';
import { salesService } from '../../sales/services/salesService';
import type { ShiftSummaryResponse } from '../types/pos';
import type { SaleResponse } from '../../sales/types/sales';
import { 
  ShoppingCart, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Eye, 
  Receipt,
  User,
  Calendar,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { formatDateForUser, formatTimeForUser } from '../../../utils/date';
import { useToast } from '../../../context/ToastContext';
import { PaySaleModal } from '../../sales/components/PaySaleModal';
import { RegisterSaleCustomerModal } from '../../sales/components/RegisterSaleCustomerModal';
import { SaleDetailsModal } from '../../sales/components/SaleDetailsModal';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BtnCancel, BtnModalYes } from '../../../components/ui/CrudButtons';

export const TerminalPage = () => {
  const [summary, setSummary] = useState<ShiftSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sales List State (Pending sales from /tenant/sales/pending)
  const [pendingSales, setPendingSales] = useState<SaleResponse[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  // Modals State
  const [selectedSaleToPay, setSelectedSaleToPay] = useState<SaleResponse | null>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleResponse | null>(null);
  const [registerCustomerSale, setRegisterCustomerSale] = useState<SaleResponse | null>(null);

  // Modal Cancelar Venta
  const [cancelingSale, setCancelingSale] = useState<SaleResponse | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const { userProfile, hasPermission, hasRole } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useToast();
  const roles = userProfile?.roles || [];
  
  const isCashierRole = hasRole('CASHIER') || roles.includes('CASHIER');
  const isManagerOrOwner = hasRole('BRANCH_MANAGER') || roles.includes('BRANCH_MANAGER') || hasRole('OWNER') || roles.includes('OWNER');
  const canAccessTerminal = isCashierRole || isManagerOrOwner || hasPermission('SAL_SALES_READ') || hasPermission('SAL_PROCESS_PAYMENT');
  
  // Permisos para acciones de cobro y cancelación
  const canProcessPayment = hasPermission('SAL_PROCESS_PAYMENT');
  const canCancelSale = hasPermission('SAL_SALES_CANCEL');

  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  useEffect(() => {
    if (canAccessTerminal) {
      loadSummary();
      loadPendingSales();
    }
  }, []);

  const loadSummary = async () => {
    // Si no es cajero, no consultamos turno activo ni mostramos arqueo
    if (!isCashierRole) {
      setSummary(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await posService.getMyActiveShiftSummary();
      setSummary(data);
    } catch (err: any) {
      console.error("Error al cargar resumen del turno:", err);
      if (
        err.response?.data?.code === 'business_rule_violation' ||
        err.response?.status === 404 ||
        err.response?.status === 400 ||
        err.response?.data?.message?.includes("OPEN shift") ||
        err.response?.data?.message?.includes("active shift")
      ) {
        setError("Aún no tienes un turno asignado. Ve a Turnos y Arqueos para abrir tu caja.");
      } else {
        setError("Ocurrió un error al cargar la terminal.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingSales = async () => {
    setIsLoadingSales(true);
    try {
      const data = await salesService.getPendingSales();
      setPendingSales(data || []);
    } catch (err) {
      console.error("Error al cargar ventas pendientes:", err);
      setPendingSales([]);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const handlePaymentSuccess = (_paidSaleId: string, _paidSaleNumber?: string) => {
    loadSummary();
    loadPendingSales();
    setRegisterCustomerSale(selectedSaleToPay);
  };

  // Cancelar venta pendiente
  const handleConfirmCancelSale = async () => {
    if (!cancelingSale) return;
    setIsCanceling(true);
    try {
      await salesService.cancelPendingSale(cancelingSale.id);
      toastSuccess(`Venta ${cancelingSale.saleNumber ? `#${cancelingSale.saleNumber}` : ''} cancelada correctamente.`);
      setCancelingSale(null);
      loadPendingSales();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al cancelar la venta pendiente.";
      toastError(msg);
    } finally {
      setIsCanceling(false);
    }
  };

  const filteredSales = pendingSales;

  if (!canAccessTerminal) {
    return (
      <div className="bg-base-100 rounded-2xl p-12 text-center shadow-sm border border-base-200 max-w-xl mx-auto mt-10">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Acceso No Autorizado</h2>
        <p className="text-base-content/60 mb-6">
          No cuentas con los permisos necesarios para operar la terminal de cobro.
        </p>
        <Link to="/" className="btn btn-primary">
          Ir al Inicio
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/60 text-sm font-medium">Verificando turno activo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-base-100 rounded-2xl p-12 text-center shadow-sm border border-base-200 max-w-xl mx-auto mt-10 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
          <Clock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Sin Turno Activo</h2>
        <p className="text-base-content/60 mb-6 leading-relaxed">
          {error}
        </p>
        <Link to="/pos/shifts" className="btn btn-primary gap-2 shadow-lg shadow-primary/30 text-white font-bold">
          <Clock size={18} /> Ir a Turnos y Arqueos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-start gap-2.5">
          <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Terminal de Cobro
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
              Gestión y cobro de pedidos pendientes del turno
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards: Solo para cajeros con turno activo */}
      {isCashierRole && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-base-100 rounded-2xl p-3.5 sm:p-4 shadow-xs border border-base-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShoppingCart size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base-content/50 text-[11px] font-semibold uppercase tracking-wider truncate">Caja Activa</p>
              <h3 className="text-sm sm:text-base font-bold text-base-content truncate">{summary.cashName || 'Sin Caja'}</h3>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-3.5 sm:p-4 shadow-xs border border-base-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base-content/50 text-[11px] font-semibold uppercase tracking-wider truncate">Apertura</p>
              <h3 className="text-sm sm:text-base font-bold text-base-content truncate">
                {summary.openedAt ? formatTimeForUser(summary.openedAt) : '--:--'}
              </h3>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-3.5 sm:p-4 shadow-xs border border-base-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base-content/50 text-[11px] font-semibold uppercase tracking-wider truncate">Ingresos</p>
              <h3 className="text-sm sm:text-base font-bold font-mono text-success truncate">
                {currencyCode} {(summary.totalInflows || 0).toFixed(2)}
              </h3>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-3.5 sm:p-4 shadow-xs border border-base-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
              <TrendingDown size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base-content/50 text-[11px] font-semibold uppercase tracking-wider truncate">Egresos</p>
              <h3 className="text-sm sm:text-base font-bold font-mono text-error truncate">
                {currencyCode} {(summary.totalOutflows || 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Sales List Grid */}
      {isLoadingSales ? (
        <div className="flex justify-center p-12 bg-base-100 rounded-2xl border border-base-200">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-base-100 rounded-2xl p-10 sm:p-12 text-center shadow-xs border border-base-200">
          <ShoppingBag size={44} className="mx-auto text-base-content/20 mb-3 stroke-1" />
          <h3 className="text-base font-bold text-base-content">No hay ventas pendientes de cobro</h3>
          <p className="text-base-content/60 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            Las ventas creadas en caja aparecerán aquí listas para ser cobradas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredSales.map((sale) => {
            return (
              <div
                key={sale.id}
                className="bg-base-100 rounded-2xl p-4 sm:p-5 shadow-xs border border-base-200 hover:border-primary/40 transition-all flex flex-col justify-between gap-3.5 group"
              >
                {/* Card Top Header */}
                <div className="flex justify-between items-start gap-2 border-b border-base-200 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-base-content/50 uppercase tracking-wider block">N° Venta</span>
                      <h4 className="font-mono font-extrabold text-sm sm:text-base text-base-content truncate">
                        {sale.saleNumber ? `#${sale.saleNumber}` : '-'}
                      </h4>
                    </div>
                  </div>

                  <span className="badge badge-sm badge-warning gap-1 py-1.5 px-2 font-bold shrink-0 text-[11px]">
                    <Clock size={12} />
                    PENDIENTE
                  </span>
                </div>

                {/* Card Info Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-base-content/70">
                    <span className="flex items-center gap-1.5 text-base-content/60">
                      <User size={13} className="text-primary/70 shrink-0" /> Vendedor:
                    </span>
                    <strong className="text-base-content font-semibold truncate max-w-[150px]">
                      {sale.employeeName || 'No asignado'}
                    </strong>
                  </div>

                  {sale.customer && (
                    <div className="flex justify-between items-center text-base-content/70">
                      <span className="flex items-center gap-1.5 text-base-content/60">
                        <UserCheck size={13} className="text-success shrink-0" /> Cliente:
                      </span>
                      <strong className="text-base-content truncate max-w-[150px]" title={sale.customer.fullName || sale.customer.firstName}>
                        {sale.customer.fullName || sale.customer.firstName}
                      </strong>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-base-content/70">
                    <span className="flex items-center gap-1.5 text-base-content/60">
                      <Calendar size={13} className="text-base-content/40 shrink-0" /> Fecha:
                    </span>
                    <span className="font-medium text-base-content/80 text-[11px]">
                      {formatDateForUser(sale.date)}
                    </span>
                  </div>

                  {sale.details && sale.details.length > 0 && (
                    <div className="flex justify-between items-center text-base-content/70">
                      <span className="flex items-center gap-1.5 text-base-content/60">
                        <ShoppingBag size={13} className="text-info shrink-0" /> Items:
                      </span>
                      <strong className="text-base-content">
                        {sale.details.length} {sale.details.length === 1 ? 'producto' : 'productos'}
                      </strong>
                    </div>
                  )}

                  {sale.discountedAmount > 0 && (
                    <div className="flex justify-between items-center text-error pt-0.5">
                      <span className="text-[11px]">Descuento:</span>
                      <span className="font-mono font-bold text-xs">-{currencyCode} {sale.discountedAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Card Total Price Banner */}
                <div className="bg-base-200/50 p-2.5 sm:p-3 rounded-xl flex justify-between items-center border border-base-200/80">
                  <span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider">Total a Cobrar</span>
                  <span className="text-lg sm:text-xl font-black text-primary font-mono">
                    {currencyCode} {(sale.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-1.5 pt-0.5">
                  {/* Botón Cobrar Venta */}
                  <ComerziaButton
                    variant="primary"
                    label="Cobrar Venta"
                    icon={<DollarSign size={16} />}
                    fullWidth
                    className="btn-sm font-bold shadow-xs active:scale-[0.99] transition-transform"
                    disabled={!canProcessPayment}
                    title={!canProcessPayment ? "Cobro deshabilitado: Se requiere permiso SAL_PROCESS_PAYMENT" : undefined}
                    onClick={() => setSelectedSaleToPay(sale)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {/* Botón Ver Detalle */}
                    <ComerziaButton
                      variant="ghost"
                      label="Detalle"
                      icon={<Eye size={14} />}
                      fullWidth
                      className="btn-sm border border-base-200 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                      onClick={() => setSelectedSaleDetail(sale)}
                    />

                    {/* Botón Cancelar Venta */}
                    {canCancelSale && (
                      <ComerziaButton
                        variant="cancel"
                        label="Cancelar"
                        icon={<Trash2 size={14} />}
                        fullWidth
                        className="btn-sm"
                        onClick={() => setCancelingSale(sale)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Procesar Cobro */}
      <PaySaleModal
        isOpen={!!selectedSaleToPay}
        onClose={() => setSelectedSaleToPay(null)}
        sale={selectedSaleToPay}
        shiftId={summary?.id || ''}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Modal: Registrar / Vincular Cliente (Opcional tras pago) */}
      <RegisterSaleCustomerModal
        isOpen={!!registerCustomerSale}
        onClose={() => setRegisterCustomerSale(null)}
        saleId={registerCustomerSale?.id || null}
        saleNumber={registerCustomerSale?.saleNumber}
        onSuccess={() => {
          loadPendingSales();
        }}
      />

      {/* Modal: Ver Detalle de Items de la Venta */}
      <SaleDetailsModal
        isOpen={!!selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        sale={selectedSaleDetail}
      />

      {/* Modal: Confirmar Cancelación de Venta */}
      <ComerziaModal
        isOpen={!!cancelingSale}
        onClose={() => setCancelingSale(null)}
        title="Confirmar Cancelación de Venta"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle size={32} />
            <p className="font-semibold text-lg">¿Estás seguro de cancelar esta venta?</p>
          </div>
          <p className="text-sm text-base-content/60">
            Esta acción abortará la venta pendiente {cancelingSale?.saleNumber ? `#${cancelingSale.saleNumber}` : ''} y devolverá inmediatamente los productos reservados a su stock físico original.
          </p>
          <div className="flex flex-row items-center gap-2 mt-6 pt-3 border-t border-base-200 w-full sm:justify-end">
            <BtnCancel onClick={() => setCancelingSale(null)} disabled={isCanceling} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
            <BtnModalYes
              label="Sí, Cancelar"
              onClick={handleConfirmCancelSale}
              isLoading={isCanceling}
              disabled={isCanceling}
              responsive={true}
              className="flex-1 sm:flex-none sm:w-auto min-w-0"
            />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
