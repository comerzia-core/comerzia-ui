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
  UserPlus, 
  Eye, 
  RefreshCw,
  Receipt,
  User,
  Calendar,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { PaySaleModal } from '../../sales/components/PaySaleModal';
import { RegisterSaleCustomerModal } from '../../sales/components/RegisterSaleCustomerModal';
import { SaleDetailsModal } from '../../sales/components/SaleDetailsModal';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';

export const TerminalPage = () => {
  const [summary, setSummary] = useState<ShiftSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sales List State
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modals State
  const [selectedSaleToPay, setSelectedSaleToPay] = useState<SaleResponse | null>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleResponse | null>(null);
  const [registerCustomerSaleId, setRegisterCustomerSaleId] = useState<string | null>(null);

  const { userProfile, hasPermission, hasRole } = useAuthStore();
  const roles = userProfile?.roles || [];
  
  const isCashierRole = hasRole('CASHIER') || roles.includes('CASHIER');
  const isManagerOrOwner = hasRole('BRANCH_MANAGER') || roles.includes('BRANCH_MANAGER') || hasRole('OWNER') || roles.includes('OWNER') || hasRole('ADMIN') || roles.includes('ADMIN');
  const canAccessTerminal = isCashierRole || isManagerOrOwner || hasPermission('SAL_SALES_READ');
  
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  const { options } = useLoadDictionaries([DICTIONARIES.SALE_STATUS]);
  const saleStatusOptions = options[DICTIONARIES.SALE_STATUS] || [];

  useEffect(() => {
    if (!canAccessTerminal) {
      setError("Vista exclusiva para roles CAJERO, BRANCH_MANAGER u OWNER.");
      setIsLoading(false);
      return;
    }
    loadSummary();
    loadSales();
  }, [canAccessTerminal]);

  const loadSummary = async () => {
    try {
      const data = await posService.getMyActiveShiftSummary();
      setSummary(data);
      setError(null);
    } catch (err: any) {
      if (isCashierRole) {
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
      } else {
        // Para MANAGER u OWNER sin rol CASHIER, no mostramos pantalla de bloqueo si no tienen turno activo
        setSummary(null);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSales = async () => {
    setIsLoadingSales(true);
    try {
      const data = await salesService.getMyShiftSales();
      setSales(data || []);
    } catch (err) {
      console.error("Error al cargar ventas del turno:", err);
      setSales([]);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const handlePaymentSuccess = (paidSaleId: string) => {
    loadSummary();
    loadSales();
    setRegisterCustomerSaleId(paidSaleId);
  };

  // Filter Sales Logic
  const filteredSales = sales.filter((sale) => {
    const code = typeof sale.saleStatus === 'object' ? sale.saleStatus.code : Number(sale.saleStatus);
    
    // Status Filter
    if (statusFilter === 'pending' && code !== 601) return false;
    if (statusFilter === 'completed' && code !== 602) return false;

    // Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchNum = sale.saleNumber?.toLowerCase().includes(query) || sale.id.toLowerCase().includes(query);
      const matchUser = sale.employeeUsername?.toLowerCase().includes(query);
      const matchItem = sale.details?.some(d => d.productName?.toLowerCase().includes(query) || d.variantName?.toLowerCase().includes(query));
      return matchNum || matchUser || matchItem;
    }

    return true;
  });

  const getStatusInfo = (status: any) => {
    const code = typeof status === 'object' ? status.code : Number(status);
    const label = typeof status === 'object' ? status.label : stockStatusLabel(code);

    if (code === 601) {
      return { code, label: label || 'Pendiente', badge: 'badge-warning text-warning-content', icon: Clock };
    }
    if (code === 602) {
      return { code, label: label || 'Completada', badge: 'badge-success text-success-content', icon: CheckCircle2 };
    }
    if (code === 603) {
      return { code, label: label || 'Cancelada', badge: 'badge-error text-error-content', icon: XCircle };
    }
    return { code, label: label || 'Estado ' + code, badge: 'badge-ghost', icon: AlertCircle };
  };

  const stockStatusLabel = (code: number) => {
    const found = saleStatusOptions.find(opt => Number(opt.value) === code);
    return found ? found.label : (code === 601 ? 'Pendiente' : code === 602 ? 'Completada' : 'Cancelada');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center text-warning mb-2 shadow-lg shadow-warning/10">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-base-content text-center max-w-md leading-tight">
          {error}
        </h2>
        <p className="text-base-content/60 text-center max-w-sm mb-4">
          Para poder utilizar la terminal de ventas, necesitas aperturar tu caja o que un administrador te asigne un turno.
        </p>
        <Link to="/pos/shifts" className="btn btn-primary gap-2 shadow-lg shadow-primary/30 text-white font-bold">
          <Clock size={18} /> Ir a Turnos y Arqueos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Terminal de Cobro</h1>
          <p className="text-base-content/60 mt-1">Ventas registradas y cobro del turno activo</p>
        </div>
        <button
          type="button"
          onClick={() => { loadSummary(); loadSales(); }}
          className="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-primary cursor-pointer border border-base-200"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Caja Activa</p>
              <h3 className="text-xl font-bold">{summary?.cashName || 'Sin Caja'}</h3>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Apertura</p>
              <h3 className="text-xl font-bold">
                {summary?.openedAt ? new Date(summary.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
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
              <p className="text-base-content/60 text-sm font-medium">Ingresos Totales</p>
              <h3 className="text-xl font-bold">{currencyCode} {(summary?.totalInflows || 0).toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Egresos Totales</p>
              <h3 className="text-xl font-bold">{currencyCode} {(summary?.totalOutflows || 0).toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-base-content/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar por N° Venta o Vendedor..."
            className="input input-bordered input-md w-full pl-10 bg-base-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Sales Cards Grid */}
      {isLoadingSales ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-base-100 rounded-2xl p-12 text-center border border-base-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/40">
            <Receipt size={32} />
          </div>
          <h3 className="text-lg font-bold text-base-content">No se encontraron ventas</h3>
          <p className="text-sm text-base-content/60 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' 
              ? 'Prueba a cambiar el filtro o el término de búsqueda.' 
              : 'Las ventas creadas por los vendedores durante el turno aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up">
          {filteredSales.map((sale) => {
            const statusInfo = getStatusInfo(sale.saleStatus);
            const StatusIcon = statusInfo.icon;
            const isPending = statusInfo.code === 601;
            const isCompleted = statusInfo.code === 602;

            return (
              <div
                key={sale.id}
                className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between gap-4 group"
              >
                {/* Card Top Header */}
                <div className="flex justify-between items-start gap-2 border-b border-base-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block">N° Venta</span>
                      <h4 className="font-mono font-extrabold text-base text-primary">
                        #{sale.saleNumber || sale.id.substring(0, 8)}
                      </h4>
                    </div>
                  </div>

                  <span className={`badge badge-sm ${statusInfo.badge} gap-1 py-2 px-2.5 font-semibold shrink-0`}>
                    <StatusIcon size={13} />
                    {statusInfo.label}
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
                    <div className="flex justify-between items-center text-success">
                      <span>Descuento aplicado:</span>
                      <span className="font-bold">-{currencyCode} {sale.discountedAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Card Total Price Banner */}
                <div className="bg-base-200/50 p-3 rounded-xl flex justify-between items-center border border-base-200">
                  <span className="text-xs font-semibold text-base-content/60 uppercase">Monto Total</span>
                  <span className="text-xl font-extrabold text-primary">
                    {currencyCode} {(sale.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-1">
                  {isPending ? (
                    isCashierRole ? (
                      <button
                        type="button"
                        onClick={() => setSelectedSaleToPay(sale)}
                        className="btn btn-primary btn-sm w-full gap-2 text-white font-bold shadow-md shadow-primary/20 hover:scale-[1.01] transition-transform cursor-pointer"
                      >
                        <DollarSign size={16} /> Cobrar Venta
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="Cobro deshabilitado: Solo usuarios con el rol Cajero pueden cobrar ventas"
                        className="btn btn-primary btn-sm w-full gap-2 text-white font-bold opacity-50 cursor-not-allowed"
                      >
                        <DollarSign size={16} /> Cobrar Venta
                      </button>
                    )
                  ) : isCompleted ? (
                    <button
                      type="button"
                      onClick={() => setRegisterCustomerSaleId(sale.id)}
                      className="btn btn-outline btn-info btn-sm w-full gap-1.5 font-semibold cursor-pointer"
                    >
                      <UserPlus size={15} /> + Registrar Datos Cliente
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setSelectedSaleDetail(sale)}
                    className="btn btn-ghost btn-sm w-full gap-2 text-base-content/70 hover:bg-base-200 cursor-pointer"
                  >
                    <Eye size={16} /> Ver Detalle de Venta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Process Payment */}
      <PaySaleModal
        isOpen={!!selectedSaleToPay}
        onClose={() => setSelectedSaleToPay(null)}
        sale={selectedSaleToPay}
        shiftId={summary?.id || ''}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Modal: Register Customer (Optional) */}
      <RegisterSaleCustomerModal
        isOpen={!!registerCustomerSaleId}
        onClose={() => setRegisterCustomerSaleId(null)}
        saleId={registerCustomerSaleId}
        onSuccess={() => {
          loadSales();
        }}
      />

      {/* Modal: Sale Details */}
      <SaleDetailsModal
        isOpen={!!selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        sale={selectedSaleDetail}
      />
    </div>
  );
};
