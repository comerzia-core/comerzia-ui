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
  RefreshCw,
  Receipt,
  User,
  Calendar,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  Search,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
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

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');

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
  const isManagerOrOwner = hasRole('BRANCH_MANAGER') || roles.includes('BRANCH_MANAGER') || hasRole('OWNER') || roles.includes('OWNER') || hasRole('ADMIN') || roles.includes('ADMIN');
  const canAccessTerminal = isCashierRole || isManagerOrOwner || hasPermission('SAL_SALES_READ') || hasPermission('SAL_PROCESS_PAYMENT');
  
  // Permisos para acciones de cobro y cancelación
  const canProcessPayment = hasPermission('SAL_PROCESS_PAYMENT') || isCashierRole || hasRole('OWNER') || hasRole('ADMIN');
  const canCancelSale = hasPermission('SAL_SALES_CANCEL') || hasRole('OWNER') || hasRole('ADMIN');

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

  // Filtrado de Ventas Pendientes
  const filteredSales = pendingSales.filter((sale) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchNum = sale.saleNumber?.toLowerCase().includes(query) || sale.id.toLowerCase().includes(query);
    const matchUser = sale.employeeUsername?.toLowerCase().includes(query);
    const matchCustomer = sale.customer?.fullName?.toLowerCase().includes(query) || sale.customer?.firstName?.toLowerCase().includes(query) || sale.customer?.documentNumber?.toLowerCase().includes(query);
    const matchItem = sale.details?.some(d => d.productName?.toLowerCase().includes(query) || d.variantName?.toLowerCase().includes(query));
    return matchNum || matchUser || matchCustomer || matchItem;
  });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Terminal de Cobro</h1>
          <p className="text-base-content/60 mt-1">Gestión de cobros para ventas pendientes del turno</p>
        </div>
        <ComerziaButton
          variant="ghost"
          label="Actualizar"
          icon={<RefreshCw size={16} />}
          className="btn-sm border border-base-200 text-base-content/70 hover:text-primary"
          onClick={() => { loadSummary(); loadPendingSales(); }}
        />
      </div>

      {/* Summary Cards: Solo para cajeros con turno activo */}
      {isCashierRole && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="text-base-content/60 text-sm font-medium">Caja Activa</p>
                <h3 className="text-xl font-bold">{summary.cashName || 'Sin Caja'}</h3>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-base-content/60 text-sm font-medium">Apertura</p>
                <h3 className="text-xl font-bold">
                  {summary.openedAt ? new Date(summary.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-base-content/60 text-sm font-medium">Total Ingresos</p>
                <h3 className="text-xl font-bold text-success">
                  {currencyCode} {(summary.totalInflows || 0).toFixed(2)}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-base-content/60 text-sm font-medium">Total Egresos</p>
                <h3 className="text-xl font-bold text-error">
                  {currencyCode} {(summary.totalOutflows || 0).toFixed(2)}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Management Filter Bar */}
      <div className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Buscar por N° Venta, vendedor, cliente o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10 bg-base-50 focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Count Badge */}
        <div className="flex items-center gap-2">
          <span className="badge badge-warning font-semibold text-xs py-3 px-3 gap-1.5">
            <Clock size={14} />
            Pendientes de Cobro ({pendingSales.length})
          </span>
        </div>
      </div>

      {/* Sales List Grid */}
      {isLoadingSales ? (
        <div className="flex justify-center p-12 bg-base-100 rounded-2xl border border-base-200">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-base-100 rounded-2xl p-12 text-center shadow-sm border border-base-200">
          <ShoppingBag size={48} className="mx-auto text-base-content/20 mb-3" />
          <h3 className="text-lg font-bold text-base-content">No hay ventas pendientes de cobro</h3>
          <p className="text-base-content/60 text-sm mt-1">
            {searchQuery 
              ? 'No se encontraron resultados para los términos de búsqueda.' 
              : 'Las ventas creadas en caja aparecerán aquí listas para ser cobradas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSales.map((sale) => {
            return (
              <div
                key={sale.id}
                className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-200 hover:border-primary/40 transition-all flex flex-col justify-between gap-4 group"
              >
                {/* Card Top Header */}
                <div className="flex justify-between items-start gap-2 border-b border-base-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block">N° Venta</span>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-mono font-extrabold text-base text-primary">
                          {sale.saleNumber ? `#${sale.saleNumber}` : '-'}
                        </h4>
                        {sale.customer && (
                          <div className="tooltip tooltip-right" data-tip={`Cliente: ${sale.customer.fullName || sale.customer.firstName}`}>
                            <UserCheck size={16} className="text-primary shrink-0 cursor-pointer" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-sm badge-warning gap-1 py-2 px-2.5 font-semibold shrink-0">
                    <Clock size={13} />
                    PENDIENTE
                  </span>
                </div>

                {/* Card Info Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-base-content/70">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User size={14} className="text-primary/70" /> Vendedor:
                    </span>
                    <strong className="text-base-content font-bold">{sale.employeeUsername || 'No asignado'}</strong>
                  </div>

                  {sale.customer && (
                    <div className="flex justify-between items-center text-base-content/70">
                      <span className="flex items-center gap-1.5 font-medium">
                        <UserCheck size={14} className="text-success" /> Cliente:
                      </span>
                      <strong className="text-base-content truncate max-w-[170px]" title={sale.customer.fullName || sale.customer.firstName}>
                        {sale.customer.fullName || sale.customer.firstName}
                      </strong>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-base-content/70">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-base-content/50" /> Fecha/Hora:
                    </span>
                    <span className="font-medium">{new Date(sale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>

                  <div className="flex justify-between items-center text-base-content/70">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShoppingBag size={14} className="text-info" /> Items:
                    </span>
                    <strong className="text-base-content">
                      {sale.details?.length || 0} {sale.details?.length === 1 ? 'producto' : 'productos'}
                    </strong>
                  </div>

                  {sale.discountedAmount > 0 && (
                    <div className="flex justify-between items-center text-error">
                      <span>Descuento aplicado:</span>
                      <span className="font-bold">-{currencyCode} {sale.discountedAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Card Total Price Banner */}
                <div className="bg-base-200/50 p-3 rounded-xl flex justify-between items-center border border-base-200">
                  <span className="text-xs font-semibold text-base-content/60 uppercase">Monto Total</span>
                  <span className="text-xl font-extrabold text-primary font-mono">
                    {currencyCode} {(sale.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-1">
                  {/* Botón Cobrar Venta */}
                  <ComerziaButton
                    variant="primary"
                    label="Cobrar Venta"
                    icon={<DollarSign size={16} />}
                    fullWidth
                    className="btn-sm text-white font-bold shadow-md shadow-primary/20 hover:scale-[1.01]"
                    disabled={!canProcessPayment}
                    title={!canProcessPayment ? "Cobro deshabilitado: Se requiere permiso de cobro de ventas (SAL_PROCESS_PAYMENT)" : undefined}
                    onClick={() => setSelectedSaleToPay(sale)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {/* Botón Ver Detalle */}
                    <ComerziaButton
                      variant="ghost"
                      label="Ver Detalle"
                      icon={<Eye size={15} />}
                      fullWidth
                      className="btn-sm border border-base-200 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                      onClick={() => setSelectedSaleDetail(sale)}
                    />

                    {/* Botón Cancelar Venta */}
                    {canCancelSale && (
                      <ComerziaButton
                        variant="cancel"
                        label="Cancelar"
                        icon={<Trash2 size={15} />}
                        fullWidth
                        className="btn-sm text-white font-semibold"
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
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setCancelingSale(null)} disabled={isCanceling} />
            <BtnModalYes
              label="Sí, Cancelar Venta"
              onClick={handleConfirmCancelSale}
              isLoading={isCanceling}
              disabled={isCanceling}
            />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
