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
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
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
  const [registerCustomerSale, setRegisterCustomerSale] = useState<SaleResponse | null>(null);

  const { userProfile, hasPermission, hasRole } = useAuthStore();
  const roles = userProfile?.roles || [];
  
  const isCashierRole = hasRole('CASHIER') || roles.includes('CASHIER');
  const isManagerOrOwner = hasRole('BRANCH_MANAGER') || roles.includes('BRANCH_MANAGER') || hasRole('OWNER') || roles.includes('OWNER') || hasRole('ADMIN') || roles.includes('ADMIN');
  const canAccessTerminal = isCashierRole || isManagerOrOwner || hasPermission('SAL_SALES_READ');
  
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  const { options } = useLoadDictionaries([DICTIONARIES.SALE_STATUS]);
  const saleStatusOptions = options[DICTIONARIES.SALE_STATUS] || [];

  useEffect(() => {
    if (canAccessTerminal) {
      loadSummary();
      loadSales();
    }
  }, []);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isManagerOrOwner) {
        const summaries = await posService.getAllActiveShiftSummaries();
        if (summaries && summaries.length > 0) {
          setSummary(summaries[0]);
        } else {
          setSummary(null);
        }
      } else {
        const data = await posService.getMyActiveShiftSummary();
        setSummary(data);
      }
    } catch (err: any) {
      console.error("Error al cargar resumen del turno:", err);
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

  const handlePaymentSuccess = (_paidSaleId: string, _paidSaleNumber?: string) => {
    loadSummary();
    loadSales();
    setRegisterCustomerSale(selectedSaleToPay);
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

  const getStatusInfo = (status: { code: number; label: string } | number) => {
    const code = typeof status === 'object' ? status.code : Number(status);
    switch (code) {
      case 601:
        return { label: 'PENDIENTE', badge: 'badge-warning', icon: Clock };
      case 602:
        return { label: 'PAGADA', badge: 'badge-success', icon: CheckCircle2 };
      case 603:
        return { label: 'ANULADA', badge: 'badge-error', icon: XCircle };
      case 604:
        return { label: 'DEVOLUCIÓN', badge: 'badge-neutral', icon: AlertCircle };
      default:
        return { label: 'DESCONOCIDO', badge: 'badge-ghost', icon: AlertCircle };
    }
  };

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Terminal de Cobro</h1>
          <p className="text-base-content/60 mt-1">Ventas registradas y cobro del turno activo</p>
        </div>
        <ComerziaButton
          variant="ghost"
          label="Actualizar"
          icon={<RefreshCw size={16} />}
          className="btn-sm border border-base-200 text-base-content/70 hover:text-primary"
          onClick={() => { loadSummary(); loadSales(); }}
        />
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
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Apertura</p>
              <h3 className="text-xl font-bold">
                {summary?.openedAt ? new Date(summary.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
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
                {currencyCode} {(summary?.totalInflows || 0).toFixed(2)}
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
                {currencyCode} {(summary?.totalOutflows || 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Management Filter Bar */}
      <div className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Buscar por N° Venta, vendedor o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10 bg-base-50 focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Filter size={14} /> Filtro:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`btn btn-sm rounded-xl font-medium ${statusFilter === 'all' ? 'btn-primary text-white shadow-sm' : 'btn-ghost text-base-content/70'}`}
          >
            Todas ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`btn btn-sm rounded-xl font-medium ${statusFilter === 'pending' ? 'btn-warning text-warning-content shadow-sm' : 'btn-ghost text-base-content/70'}`}
          >
            Pendientes ({sales.filter(s => (typeof s.saleStatus === 'object' ? s.saleStatus.code : Number(s.saleStatus)) === 601).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`btn btn-sm rounded-xl font-medium ${statusFilter === 'completed' ? 'btn-success text-white shadow-sm' : 'btn-ghost text-base-content/70'}`}
          >
            Pagadas ({sales.filter(s => (typeof s.saleStatus === 'object' ? s.saleStatus.code : Number(s.saleStatus)) === 602).length})
          </button>
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
          <h3 className="text-lg font-bold text-base-content">No se encontraron ventas</h3>
          <p className="text-base-content/60 text-sm mt-1">
            {searchQuery || statusFilter !== 'all' 
              ? 'Intenta cambiando los términos de búsqueda o los filtros.' 
              : 'Las ventas creadas en caja aparecerán aquí listas para ser cobradas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSales.map((sale) => {
            const statusInfo = getStatusInfo(sale.saleStatus);
            const StatusIcon = statusInfo.icon;
            const statusCode = typeof sale.saleStatus === 'object' ? sale.saleStatus.code : Number(sale.saleStatus);
            const isPending = statusCode === 601;
            const isCompleted = statusCode === 602;

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
                      <h4 className="font-mono font-extrabold text-base text-primary">
                        {sale.saleNumber ? `#${sale.saleNumber}` : '-'}
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
                    <ComerziaButton
                      variant="primary"
                      label="Cobrar Venta"
                      icon={<DollarSign size={16} />}
                      fullWidth
                      className="btn-sm text-white font-bold shadow-md shadow-primary/20 hover:scale-[1.01]"
                      disabled={!isCashierRole}
                      title={!isCashierRole ? "Cobro deshabilitado: Solo usuarios con el rol Cajero pueden cobrar ventas" : undefined}
                      onClick={() => setSelectedSaleToPay(sale)}
                    />
                  ) : isCompleted ? (
                    <ComerziaButton
                      variant="ghost"
                      label="+ Registrar Datos Cliente"
                      icon={<UserPlus size={15} />}
                      fullWidth
                      className="btn-sm border border-info text-info hover:bg-info/10 font-semibold"
                      onClick={() => setRegisterCustomerSale(sale)}
                    />
                  ) : null}

                  <ComerziaButton
                    variant="ghost"
                    label="Ver Detalle de Venta"
                    icon={<Eye size={16} />}
                    fullWidth
                    className="btn-sm text-base-content/70 hover:bg-base-200"
                    onClick={() => setSelectedSaleDetail(sale)}
                  />
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
        isOpen={!!registerCustomerSale}
        onClose={() => setRegisterCustomerSale(null)}
        saleId={registerCustomerSale?.id || null}
        saleNumber={registerCustomerSale?.saleNumber}
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
