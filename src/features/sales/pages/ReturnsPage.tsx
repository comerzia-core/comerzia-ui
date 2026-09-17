import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import { posService } from '../../pos/services/posService';
import type { SaleResponse, SaleDetailResponse } from '../types/sales';
import type { ShiftSummaryResponse } from '../../pos/types/pos';
import { useToast } from '../../../context/ToastContext';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { formatDateForUser } from '../../../utils/date';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BtnCancel, BtnModalYes } from '../../../components/ui/CrudButtons';
import { 
  Search, 
  AlertTriangle, 
  FileText, 
  Receipt, 
  User, 
  Calendar, 
  ShoppingBag, 
  UserCheck, 
  RotateCcw,
  Minus,
  Plus,
  Clock,
  Wallet
} from 'lucide-react';

export const ReturnsPage = () => {
  const { saleNumber: routeSaleNumber } = useParams<{ saleNumber?: string }>();
  const [searchParams] = useSearchParams();

  const { userProfile } = useAuthStore();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const { options: dictOptions } = useLoadDictionaries([
    DICTIONARIES.PAYMENT_TYPE
  ]);
  const paymentTypeOptions = dictOptions[DICTIONARIES.PAYMENT_TYPE] || [];

  const [saleNumberInput, setSaleNumberInput] = useState('');
  const [activeSale, setActiveSale] = useState<SaleResponse | null>(null);
  const [isLoadingSale, setIsLoadingSale] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ title: string; message: string; type: 'warning' | 'error' | 'info' } | null>(null);

  // Formulario de Devolución
  const [reason, setReason] = useState('');
  const [returnPaymentType, setReturnPaymentType] = useState<string>('');
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({}); // saleDetailId -> quantityToReturn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Turno destino (cuando el turno original está cerrado)
  const [requiresTargetShift, setRequiresTargetShift] = useState(false);
  const [activeShifts, setActiveShifts] = useState<ShiftSummaryResponse[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shiftErrorMessage, setShiftErrorMessage] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

  // Inicializar tipo de pago por defecto cuando cargan los diccionarios
  useEffect(() => {
    if (paymentTypeOptions.length > 0 && !returnPaymentType) {
      setReturnPaymentType(String(paymentTypeOptions[0].value));
    }
  }, [paymentTypeOptions, returnPaymentType]);

  // Si hay un saleNumber en la URL o query param al montar, buscarlo directamente
  useEffect(() => {
    const targetNumber = routeSaleNumber || searchParams.get('saleNumber');
    if (targetNumber) {
      setSaleNumberInput(targetNumber);
      fetchSaleByNumber(targetNumber);
    }
  }, [routeSaleNumber, searchParams]);

  const getStatusCode = (status: number | { code: number; label: string } | undefined): number => {
    if (typeof status === 'number') return status;
    if (status && typeof status === 'object' && 'code' in status) return status.code;
    return 0;
  };

  // Helper para obtener la cantidad máxima disponible para devolver (en unidades de recibo/presentación)
  const getMaxReturnQty = (detail: SaleDetailResponse): number => {
    const factor = detail.equivalenceFactor || 1;
    const purchasedReceipt = detail.receiptQuantity ?? detail.unitQuantity ?? 1;
    const returnedPhysical = detail.returnedQuantity ?? 0;
    const returnedReceipt = factor > 0 ? returnedPhysical / factor : 0;
    return Math.max(0, purchasedReceipt - returnedReceipt);
  };

  // Cargar turnos activos de la sucursal de la venta
  const loadBranchActiveShifts = async (branchId: string) => {
    setIsLoadingShifts(true);
    setShiftErrorMessage(null);
    try {
      const shifts = await posService.getActiveShiftsByBranch(branchId);
      setActiveShifts(shifts);
      if (shifts && shifts.length > 0) {
        setSelectedShiftId(shifts[0].id);
      } else {
        setSelectedShiftId('');
        setShiftErrorMessage("No existen turnos de caja abiertos en la sucursal de esta venta. Para registrar la salida de dinero y completar la devolución, debe abrir un nuevo turno o reabrir uno existente desde el módulo POS.");
      }
    } catch (err: any) {
      console.error("Error al obtener turnos activos por sucursal:", err);
      const data = err.response?.data;
      const errorCode = data?.errorCode || data?.code;
      const rawMsg = data?.message;
      let msg = "No se pudieron obtener los turnos de caja activos de la sucursal.";
      if (errorCode === 'resource_not_found' || rawMsg?.toLowerCase().includes('not found')) {
        msg = "No se encontró la sucursal para consultar los turnos de caja.";
      } else if (rawMsg) {
        msg = rawMsg;
      }
      setShiftErrorMessage(msg);
    } finally {
      setIsLoadingShifts(false);
    }
  };

  // Buscar Venta por N° de Venta usando /tenant/sales/number/{saleNumber}
  const fetchSaleByNumber = async (numberToSearch: string) => {
    const term = numberToSearch.trim();
    if (!term) return;

    setIsLoadingSale(true);
    setActiveSale(null);
    setStatusNotice(null);
    setReason('');
    setReturnQtys({});
    setShakeKey(0);
    setRequiresTargetShift(false);
    setActiveShifts([]);
    setSelectedShiftId('');
    setShiftErrorMessage(null);

    try {
      const sale = await salesService.getSaleByNumber(term);
      const statusCode = getStatusCode(sale.saleStatus);

      // Validar si el estado permite devolución (602 COMPLETED o 605 PARTIALLY_REFUNDED)
      if (statusCode === 601) {
        setStatusNotice({
          title: "Venta Pendiente de Pago",
          message: "Esta venta aún no ha sido cobrada (estado PENDIENTE). No se pueden procesar devoluciones sobre ventas pendientes. Si deseas cancelarla, hazlo desde el Historial de Ventas.",
          type: "warning"
        });
        setActiveSale(sale);
      } else if (statusCode === 603) {
        setStatusNotice({
          title: "Venta Cancelada",
          message: "Esta venta fue CANCELADA antes de su pago. El inventario fue liberado previamente y no registra movimientos de caja.",
          type: "error"
        });
        setActiveSale(sale);
      } else if (statusCode === 604) {
        setStatusNotice({
          title: "Venta Anulada",
          message: "Esta venta fue ANULADA por rollback completo. No se pueden procesar devoluciones sobre una venta ya anulada.",
          type: "error"
        });
        setActiveSale(sale);
      } else if (statusCode === 606) {
        setStatusNotice({
          title: "Venta con Devolución Total",
          message: "Esta venta ya fue devuelta en su totalidad (100% de los productos reingresados). No quedan ítems disponibles para devolver.",
          type: "info"
        });
        setActiveSale(sale);
      } else if (statusCode === 602 || statusCode === 605) {
        setActiveSale(sale);
        // Inicializar cantidades de devolución en 0
        const initialQtys: Record<string, number> = {};
        (sale.details || []).forEach((d: SaleDetailResponse) => {
          initialQtys[d.id] = 0;
        });
        setReturnQtys(initialQtys);
      } else {
        setStatusNotice({
          title: "Estado No Procesable",
          message: "El estado actual de la venta no permite procesar devoluciones.",
          type: "warning"
        });
        setActiveSale(sale);
      }
    } catch (err: any) {
      console.error("Error al buscar venta por número:", err);
      const data = err.response?.data;
      const errorCode = data?.errorCode || data?.code;
      const rawMsg = data?.message || '';

      let msg = `No se encontró la venta con el número "${term}".`;
      if (
        errorCode === 'resource_not_found' ||
        rawMsg.toLowerCase().includes('not found') ||
        rawMsg.toLowerCase().includes('sale was not found')
      ) {
        msg = `No se encontró ninguna venta registrada con el número "${term}".`;
      } else if (errorCode === 'access_denied') {
        msg = "No cuentas con los permisos necesarios para consultar esta venta.";
      } else if (rawMsg) {
        msg = rawMsg;
      }

      toastError(msg);
      setActiveSale(null);
      setStatusNotice(null);
    } finally {
      setIsLoadingSale(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleNumberInput.trim()) return;
    fetchSaleByNumber(saleNumberInput);
  };

  // Devolver todo lo disponible
  const handleSelectAllToReturn = () => {
    if (!activeSale) return;
    const allQtys: Record<string, number> = {};
    (activeSale.details || []).forEach(d => {
      allQtys[d.id] = getMaxReturnQty(d);
    });
    setReturnQtys(allQtys);
  };

  // Desglose de Reembolso con Precios, Factores y Descuentos
  const calculateRefundBreakdown = () => {
    if (!activeSale) return { subtotalRefund: 0, discountRefund: 0, totalRefund: 0, totalReceiptItems: 0, totalPhysicalItems: 0 };
    let subtotalRefund = 0;
    let discountRefund = 0;
    let totalRefund = 0;
    let totalReceiptItems = 0;
    let totalPhysicalItems = 0;

    (activeSale.details || []).forEach(d => {
      const qtyToReturn = returnQtys[d.id] || 0;
      if (qtyToReturn > 0) {
        const factor = d.equivalenceFactor || 1;
        totalReceiptItems += qtyToReturn;
        totalPhysicalItems += qtyToReturn * factor;

        const totalPurchasedQty = d.receiptQuantity ?? d.unitQuantity ?? 1;
        const lineSuggested = d.lineTotalSuggested ?? (d.receiptUnitPrice ? d.receiptUnitPrice * totalPurchasedQty : 0);
        const lineDiscount = d.lineTotalDiscount ?? (d.unitDiscountAmount ? d.unitDiscountAmount * totalPurchasedQty : 0);
        const lineFinal = d.lineTotalFinal ?? (lineSuggested - lineDiscount);

        const unitSuggested = totalPurchasedQty > 0 ? lineSuggested / totalPurchasedQty : (d.receiptUnitPrice ?? 0);
        const unitDiscount = totalPurchasedQty > 0 ? lineDiscount / totalPurchasedQty : 0;
        const unitFinal = totalPurchasedQty > 0 ? lineFinal / totalPurchasedQty : (unitSuggested - unitDiscount);

        subtotalRefund += unitSuggested * qtyToReturn;
        discountRefund += unitDiscount * qtyToReturn;
        totalRefund += unitFinal * qtyToReturn;
      }
    });

    return { subtotalRefund, discountRefund, totalRefund, totalReceiptItems, totalPhysicalItems };
  };

  // Enviar devolución
  const handleSubmitReturn = async () => {
    if (!activeSale) return;
    if (!reason.trim()) {
      setShakeKey(prev => prev + 1);
      toastError("Debes especificar el motivo de la devolución.");
      return;
    }

    if (requiresTargetShift && !selectedShiftId) {
      setShakeKey(prev => prev + 1);
      toastError("Debes seleccionar un turno de caja activo para procesar la devolución.");
      return;
    }

    const returnDetails = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([detailId, qty]) => ({
        saleDetailId: detailId,
        quantityToReturn: qty
      }));

    if (returnDetails.length === 0) {
      toastWarning("Debes seleccionar al menos un producto y una cantidad mayor a 0 para devolver.");
      return;
    }

    const paymentTypeNum = Number(returnPaymentType) || (paymentTypeOptions[0]?.value ? Number(paymentTypeOptions[0].value) : 701);

    setIsSubmitting(true);
    try {
      const payload = {
        reason: reason.trim(),
        returnPaymentType: paymentTypeNum,
        returnDetails,
        ...(selectedShiftId ? { targetShiftId: selectedShiftId } : {})
      };

      await salesService.processReturn(activeSale.id, payload);
      toastSuccess("Devolución procesada y registrada exitosamente. Inventario y caja actualizados.");
      setShowConfirmModal(false);
      
      // Recargar la venta actualizada por número para reflejar nuevo estado (605 o 606)
      if (activeSale.saleNumber) {
        fetchSaleByNumber(activeSale.saleNumber);
      }
    } catch (err: any) {
      const data = err.response?.data;
      const status = err.response?.status;
      const errorCode = data?.errorCode || data?.code;
      const rawMsg = data?.message || '';

      const isShiftClosed = status === 409 || errorCode === 'shift_closed' || errorCode === 'shift_not_open' || (status === 400 && (
        rawMsg.includes("targetShiftId") ||
        rawMsg.toLowerCase().includes("shift") ||
        rawMsg.toLowerCase().includes("turno") ||
        rawMsg.toLowerCase().includes("closed")
      ));

      // Si el turno original está cerrado y aún no habíamos pedido targetShiftId
      if (isShiftClosed && !selectedShiftId) {
        setRequiresTargetShift(true);
        setShowConfirmModal(false);
        toastWarning("El turno original de la venta está cerrado. Selecciona a continuación en qué turno activo registrar la devolución.");
        if (activeSale.branchId) {
          loadBranchActiveShifts(activeSale.branchId);
        } else {
          setShiftErrorMessage("La venta no contiene el ID de sucursal requerido para buscar turnos activos.");
        }
        return;
      }

      let errorDisplay = "Ocurrió un error al procesar la devolución.";
      if (errorCode === 'resource_not_found' || rawMsg.toLowerCase().includes('not found')) {
        errorDisplay = "No se encontró la venta, turno o producto especificado para la devolución.";
      } else if (errorCode === 'invalid_quantity' || rawMsg.toLowerCase().includes('quantity')) {
        errorDisplay = "La cantidad a devolver no es válida o excede lo disponible.";
      } else if (errorCode === 'shift_branch_mismatch') {
        errorDisplay = "El turno seleccionado no pertenece a la sucursal de la venta.";
      } else if (errorCode === 'sale_not_returnable') {
        errorDisplay = "El estado actual de la venta no permite procesar devoluciones.";
      } else if (errorCode === 'access_denied') {
        errorDisplay = "No cuentas con los permisos necesarios para procesar devoluciones.";
      } else if (rawMsg) {
        errorDisplay = rawMsg;
      }

      toastError(errorDisplay);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refundBreakdown = calculateRefundBreakdown();
  const hasItemsToReturn = refundBreakdown.totalReceiptItems > 0;
  const isReturnable = activeSale && (getStatusCode(activeSale.saleStatus) === 602 || getStatusCode(activeSale.saleStatus) === 605);

  const selectedPaymentLabel = paymentTypeOptions.find(opt => String(opt.value) === String(returnPaymentType))?.label || 'Efectivo';
  const selectedShiftObj = activeShifts.find(s => s.id === selectedShiftId);

  return (
    <div className="space-y-5 w-full animate-fade-in">
      {/* Header Principal Minimalista */}
      <div className="flex items-start gap-2.5">
        <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
            Devoluciones de Venta
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            Reintegro de productos al inventario y gestión contable de reembolsos
          </p>
        </div>
      </div>

      {/* Buscador de Venta por N° */}
      <div className="card bg-base-100 p-3 sm:p-4 rounded-2xl shadow-xs border border-base-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por N° de venta (ej. VEN-000001)..."
              className="input input-sm sm:input-md input-bordered w-full pl-9 pr-8 font-mono text-sm bg-base-100 border-base-300 focus:border-primary"
              value={saleNumberInput}
              onChange={(e) => setSaleNumberInput(e.target.value)}
            />
            {saleNumberInput && (
              <button
                type="button"
                onClick={() => { setSaleNumberInput(''); setActiveSale(null); setStatusNotice(null); }}
                className="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                title="Limpiar"
              >
                ✕
              </button>
            )}
          </div>
          <ComerziaButton
            type="submit"
            variant="primary"
            label="Buscar"
            icon={<Search size={15} />}
            disabled={isLoadingSale || !saleNumberInput.trim()}
            isLoading={isLoadingSale}
            className="btn-sm sm:btn-md shrink-0 font-semibold"
          />
        </form>
      </div>

      {/* Alerta / Notificación de Estado No Retornable */}
      {statusNotice && (
        <div className={`p-3.5 sm:p-4 rounded-xl border flex gap-3 text-xs items-start animate-fade-in ${
          statusNotice.type === 'error' ? 'bg-error/10 border-error/20 text-error' :
          statusNotice.type === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' :
          'bg-info/10 border-info/20 text-info'
        }`}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs sm:text-sm">{statusNotice.title}</h4>
            <p className="leading-relaxed opacity-90">{statusNotice.message}</p>
          </div>
        </div>
      )}

      {/* Contenido Principal de Devolución */}
      {activeSale && (
        <div className="space-y-5 animate-fade-in">
          {/* Ficha Resumen de la Venta (Minimalista) */}
          <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <Receipt size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold font-mono text-base text-base-content">
                    #{activeSale.saleNumber || activeSale.id}
                  </span>
                  <span className={`badge badge-sm font-semibold ${
                    getStatusCode(activeSale.saleStatus) === 602 ? 'badge-success text-white' :
                    getStatusCode(activeSale.saleStatus) === 605 ? 'badge-secondary text-white' :
                    getStatusCode(activeSale.saleStatus) === 606 ? 'badge-neutral' : 'badge-warning'
                  }`}>
                    {getStatusCode(activeSale.saleStatus) === 602 ? 'Completada' :
                     getStatusCode(activeSale.saleStatus) === 605 ? 'Dev. Parcial' :
                     getStatusCode(activeSale.saleStatus) === 606 ? 'Dev. Total' : 'Pendiente'}
                  </span>
                  {activeSale.branchName && (
                    <span className="badge badge-sm badge-outline font-medium text-xs">
                      {activeSale.branchName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-base-content/60 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDateForUser(activeSale.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} /> {activeSale.employeeUsername}
                  </span>
                  {activeSale.customer && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <UserCheck size={12} /> {activeSale.customer.fullName || activeSale.customer.firstName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
              <span className="text-[11px] text-base-content/50 uppercase font-medium">Total Facturado</span>
              <span className="text-base sm:text-lg font-bold font-mono text-base-content">
                {currency} {(activeSale.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Grid de 2 Columnas (Productos + Resumen) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Columna Izquierda: Listado de Productos (8 cols) */}
            <div className="lg:col-span-8 card bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-base-200/60">
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-2">
                    <FileText className="text-primary w-4 h-4" />
                    Ítems Facturados
                  </h2>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Indica la cantidad a devolver por producto
                  </p>
                </div>

                {isReturnable && (
                  <button
                    type="button"
                    onClick={handleSelectAllToReturn}
                    className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 gap-1 font-semibold"
                    title="Devolver todo lo disponible"
                  >
                    <RotateCcw size={12} />
                    Devolver Todo
                  </button>
                )}
              </div>

              {/* VISTA DESKTOP: TABLA MINIMALISTA */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-sm w-full text-xs">
                  <thead>
                    <tr className="border-b border-base-200 text-base-content/70 font-semibold text-[11px] uppercase">
                      <th>Producto</th>
                      <th className="text-center">Comprado</th>
                      <th className="text-right">Precio Unit.</th>
                      <th className="text-center w-44">Cant. a Devolver</th>
                      <th className="text-right">Reembolso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200/60">
                    {(activeSale.details || []).map((d: SaleDetailResponse) => {
                      const factor = d.equivalenceFactor || 1;
                      const purchasedQty = d.receiptQuantity ?? d.unitQuantity ?? 1;

                      const totalReturnedPhysical = d.returnedQuantity ?? 0;
                      const alreadyReturnedReceipt = factor > 0 ? totalReturnedPhysical / factor : 0;

                      const maxQty = getMaxReturnQty(d);
                      const currentReturnQty = returnQtys[d.id] || 0;
                      const currentReturnPhysical = currentReturnQty * factor;

                      const lineSuggested = d.lineTotalSuggested ?? (d.receiptUnitPrice ? d.receiptUnitPrice * purchasedQty : 0);
                      const lineDiscount = d.lineTotalDiscount ?? (d.unitDiscountAmount ? d.unitDiscountAmount * purchasedQty : 0);
                      const lineFinal = d.lineTotalFinal ?? (lineSuggested - lineDiscount);

                      const unitFinal = purchasedQty > 0 ? lineFinal / purchasedQty : (d.receiptUnitPrice ?? 0);
                      const lineFinalRefund = unitFinal * currentReturnQty;

                      return (
                        <tr key={`desktop-return-${d.id}`} className="hover:bg-base-200/30 transition-colors">
                          <td>
                            <div className="space-y-0.5 max-w-[260px]">
                              <div className="flex items-baseline gap-1.5 flex-wrap" title={`${d.productName || 'Producto'}${d.variantName ? ` - ${d.variantName}` : ''}`}>
                                <span className="font-semibold text-xs text-base-content">
                                  {d.productName || 'Producto'}
                                </span>
                                {d.variantName && (
                                  <span className="text-[11px] text-base-content/70 font-medium">
                                    - {d.variantName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {d.measureUnitName && (
                                  <span className="badge badge-ghost badge-xs text-[10px] py-0 font-medium">
                                    {d.measureUnitName}
                                  </span>
                                )}
                                {factor > 1 && (
                                  <span className="badge badge-info badge-xs text-white text-[10px] py-0 font-bold">
                                    x{factor}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center font-mono">
                            <span className="font-medium text-base-content">
                              {purchasedQty} {d.measureUnitName || ''}
                            </span>
                            {totalReturnedPhysical > 0 && (
                              <span className="block text-[10px] text-warning font-semibold">
                                ({alreadyReturnedReceipt} ya devueltos)
                              </span>
                            )}
                          </td>
                          <td className="text-right font-mono">
                            <span className="font-medium text-base-content">
                              {currency} {unitFinal.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center">
                            {isReturnable && maxQty > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    disabled={currentReturnQty <= 0}
                                    onClick={() => setReturnQtys({ ...returnQtys, [d.id]: Math.max(0, currentReturnQty - 1) })}
                                    className="btn btn-ghost btn-xs btn-square h-6 w-6 min-h-0 text-base-content/60 hover:text-base-content border border-base-300 disabled:opacity-30"
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxQty}
                                    className="input input-bordered input-xs w-12 text-center font-bold font-mono h-6 px-1"
                                    value={currentReturnQty}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(maxQty, parseInt(e.target.value) || 0));
                                      setReturnQtys({ ...returnQtys, [d.id]: val });
                                    }}
                                  />
                                  <button
                                    type="button"
                                    disabled={currentReturnQty >= maxQty}
                                    onClick={() => setReturnQtys({ ...returnQtys, [d.id]: Math.min(maxQty, currentReturnQty + 1) })}
                                    className="btn btn-ghost btn-xs btn-square h-6 w-6 min-h-0 text-base-content/60 hover:text-base-content border border-base-300 disabled:opacity-30"
                                  >
                                    <Plus size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs text-[10px] text-primary px-1 hover:underline ml-0.5"
                                    onClick={() => setReturnQtys({ ...returnQtys, [d.id]: maxQty })}
                                    title={`Máximo (${maxQty})`}
                                  >
                                    /{maxQty}
                                  </button>
                                </div>
                                {factor > 1 && currentReturnQty > 0 && (
                                  <span className="text-[10px] text-primary font-medium">
                                    ({currentReturnPhysical} u. físicas)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="badge badge-ghost badge-xs text-base-content/50">
                                {maxQty === 0 ? 'Devuelto' : 'No disponible'}
                              </span>
                            )}
                          </td>
                          <td className="text-right font-mono">
                            <span className={`font-semibold ${lineFinalRefund > 0 ? 'text-error font-bold' : 'text-base-content/30'}`}>
                              {lineFinalRefund > 0 ? `-${currency} ${lineFinalRefund.toFixed(2)}` : '0.00'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* VISTA MOBILE: CARDS MINIMALISTAS */}
              <div className="block md:hidden space-y-2.5">
                {(activeSale.details || []).map((d: SaleDetailResponse) => {
                  const factor = d.equivalenceFactor || 1;
                  const purchasedQty = d.receiptQuantity ?? d.unitQuantity ?? 1;

                  const totalReturnedPhysical = d.returnedQuantity ?? 0;
                  const alreadyReturnedReceipt = factor > 0 ? totalReturnedPhysical / factor : 0;
                  const maxQty = getMaxReturnQty(d);
                  const currentReturnQty = returnQtys[d.id] || 0;

                  const lineSuggested = d.lineTotalSuggested ?? (d.receiptUnitPrice ? d.receiptUnitPrice * purchasedQty : 0);
                  const lineDiscount = d.lineTotalDiscount ?? (d.unitDiscountAmount ? d.unitDiscountAmount * purchasedQty : 0);
                  const lineFinal = d.lineTotalFinal ?? (lineSuggested - lineDiscount);

                  const unitFinal = purchasedQty > 0 ? lineFinal / purchasedQty : (d.receiptUnitPrice ?? 0);
                  const lineFinalRefund = unitFinal * currentReturnQty;

                  return (
                    <div key={`mobile-return-${d.id}`} className="p-3 rounded-xl bg-base-100 border border-base-200 shadow-xs space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1 flex-wrap">
                            <span className="font-semibold text-xs text-base-content">
                              {d.productName || 'Producto'}
                            </span>
                            {d.variantName && (
                              <span className="text-[11px] text-base-content/70 font-medium">
                                - {d.variantName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-base-content/60 mt-0.5">
                            <span>Comprado: {purchasedQty} {d.measureUnitName || 'u'}</span>
                            <span>&bull;</span>
                            <span className="font-mono">{currency} {unitFinal.toFixed(2)}</span>
                          </div>
                          {totalReturnedPhysical > 0 && (
                            <span className="text-[10px] text-warning font-semibold block mt-0.5">
                              {alreadyReturnedReceipt} devueltos anteriormente
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0 font-mono">
                          <span className={`text-xs font-bold ${lineFinalRefund > 0 ? 'text-error' : 'text-base-content/40'}`}>
                            {lineFinalRefund > 0 ? `-${currency} ${lineFinalRefund.toFixed(2)}` : '0.00'}
                          </span>
                        </div>
                      </div>

                      {isReturnable && maxQty > 0 ? (
                        <div className="flex items-center justify-between pt-2 border-t border-base-200/60">
                          <span className="text-xs text-base-content/70 font-medium">Devolver:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={currentReturnQty <= 0}
                              onClick={() => setReturnQtys({ ...returnQtys, [d.id]: Math.max(0, currentReturnQty - 1) })}
                              className="btn btn-ghost btn-xs btn-square h-7 w-7 min-h-0 text-base-content/60 border border-base-300 disabled:opacity-30"
                            >
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={maxQty}
                              className="input input-bordered input-xs w-12 text-center font-bold font-mono h-7 px-1"
                              value={currentReturnQty}
                              onWheel={(e) => (e.target as HTMLElement).blur()}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(maxQty, parseInt(e.target.value) || 0));
                                setReturnQtys({ ...returnQtys, [d.id]: val });
                              }}
                            />
                            <button
                              type="button"
                              disabled={currentReturnQty >= maxQty}
                              onClick={() => setReturnQtys({ ...returnQtys, [d.id]: Math.min(maxQty, currentReturnQty + 1) })}
                              className="btn btn-ghost btn-xs btn-square h-7 w-7 min-h-0 text-base-content/60 border border-base-300 disabled:opacity-30"
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-primary font-bold px-1.5 h-7 min-h-0 hover:bg-primary/10"
                              onClick={() => setReturnQtys({ ...returnQtys, [d.id]: maxQty })}
                            >
                              Máx ({maxQty})
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right text-[11px] text-base-content/40 italic pt-1 border-t border-base-200/60">
                          {maxQty === 0 ? 'Totalmente devuelto' : 'No disponible'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha: Resumen de Reembolso Minimalista (4 cols) */}
            <div className="lg:col-span-4">
              <div className="card bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-xs space-y-4 lg:sticky lg:top-4">
                <h3 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-2 pb-2.5 border-b border-base-200/60">
                  <ShoppingBag size={18} className="text-primary" />
                  Resumen de Reembolso
                </h3>

                {/* Desglose Numérico */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-base-content/70">
                    <span>Ítems a devolver:</span>
                    <span className="font-semibold text-base-content">
                      {refundBreakdown.totalReceiptItems} unidades
                      {refundBreakdown.totalPhysicalItems !== refundBreakdown.totalReceiptItems && (
                        <span className="text-[10px] text-primary ml-1">
                          ({refundBreakdown.totalPhysicalItems} físicas)
                        </span>
                      )}
                    </span>
                  </div>

                  {refundBreakdown.discountRefund > 0 && (
                    <>
                      <div className="flex justify-between text-base-content/70">
                        <span>Subtotal de lista:</span>
                        <span className="font-mono">{currency} {refundBreakdown.subtotalRefund.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-error font-medium">
                        <span>Descuento deducido:</span>
                        <span className="font-mono">-{currency} {refundBreakdown.discountRefund.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-baseline pt-2.5 border-t border-base-200/60">
                    <span className="font-semibold text-xs sm:text-sm text-base-content">Total Reembolso:</span>
                    <span className="text-lg sm:text-xl font-black font-mono text-error">
                      -{currency} {refundBreakdown.totalRefund.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Formulario y Botón de Acción */}
                {isReturnable && (
                  <div className="space-y-3 pt-2">
                    {/* Método de Pago / Reembolso */}
                    <ComerziaSelect
                      label="Método de Reembolso"
                      value={returnPaymentType}
                      onChange={(e) => setReturnPaymentType(e.target.value)}
                      options={paymentTypeOptions}
                      isRequired
                      error={!returnPaymentType && shakeKey > 0 ? "Seleccione un método" : ""}
                    />

                    {/* Motivo de Devolución */}
                    <ComerziaInput
                      label="Motivo de la Devolución"
                      placeholder="Ej. Producto defectuoso, error en pedido..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      isRequired
                      shakeKey={shakeKey}
                      error={!reason.trim() && shakeKey > 0 ? "El motivo es obligatorio" : ""}
                    />

                    {/* Sección Inline: Turno Destino para Caja (cuando el turno original está cerrado) */}
                    {requiresTargetShift && (
                      <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                            <Clock size={14} className="text-primary" />
                            Turno para Imputar Reembolso
                          </span>
                          {activeSale.branchName && (
                            <span className="badge badge-sm badge-ghost text-[10px] font-medium truncate max-w-[120px]">
                              {activeSale.branchName}
                            </span>
                          )}
                        </div>

                        {isLoadingShifts ? (
                          <div className="flex items-center justify-center py-4 text-xs text-base-content/60 gap-2">
                            <span className="loading loading-spinner loading-xs text-primary"></span>
                            Buscando turnos activos...
                          </div>
                        ) : shiftErrorMessage ? (
                          <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning-content text-xs flex items-start gap-2">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-warning" />
                            <p className="leading-snug text-[11px]">{shiftErrorMessage}</p>
                          </div>
                        ) : activeShifts.length > 0 ? (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                            {activeShifts.map((shift) => {
                              const isSelected = selectedShiftId === shift.id;
                              return (
                                <div
                                  key={shift.id}
                                  onClick={() => setSelectedShiftId(shift.id)}
                                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-primary/10 border-primary shadow-xs font-semibold'
                                      : 'bg-base-100 border-base-200 hover:border-base-300'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-base-content">{shift.cashName}</span>
                                      <span className="text-[10px] text-base-content/60">({shift.employeeName})</span>
                                    </div>
                                    <span className="text-[10px] text-base-content/60 block mt-0.5">
                                      Abierto: {formatDateForUser(shift.openedAt)}
                                    </span>
                                  </div>
                                  <input
                                    type="radio"
                                    name="targetShift"
                                    checked={isSelected}
                                    onChange={() => setSelectedShiftId(shift.id)}
                                    className="radio radio-primary radio-xs shrink-0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning-content text-xs flex items-start gap-2">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-warning" />
                            <p className="leading-snug text-[11px]">
                              No hay turnos de caja abiertos en esta sucursal. Debe abrir un turno en el módulo POS para registrar el reembolso.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-2.5 bg-warning/10 rounded-xl text-[11px] text-warning-content border border-warning/20">
                      <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                      <span>Reintegra el stock al inventario y genera un egreso contable en caja.</span>
                    </div>

                    <ComerziaButton
                      variant="delete"
                      label="Procesar Devolución"
                      fullWidth
                      disabled={
                        !hasItemsToReturn || 
                        !reason.trim() || 
                        isSubmitting ||
                        (requiresTargetShift && (!selectedShiftId || Boolean(shiftErrorMessage)))
                      }
                      onClick={() => setShowConfirmModal(true)}
                      className="font-bold py-2.5"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Final Minimalista */}
      <ComerziaModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Devolución"
      >
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2.5 text-error">
            <AlertTriangle size={24} />
            <div>
              <p className="font-bold text-base">¿Procesar esta devolución?</p>
              <p className="text-xs text-base-content/60 font-mono">Venta #{activeSale?.saleNumber}</p>
            </div>
          </div>

          <div className="p-3 bg-base-200/50 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-base-content/60">Método de Reembolso:</span>
              <span className="font-semibold text-base-content flex items-center gap-1">
                <Wallet size={12} className="text-primary" /> {selectedPaymentLabel}
              </span>
            </div>
            {selectedShiftObj && (
              <div className="flex justify-between">
                <span className="text-base-content/60">Turno de Caja:</span>
                <span className="font-semibold text-base-content">
                  {selectedShiftObj.cashName} ({selectedShiftObj.employeeName})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-base-content/60">Motivo:</span>
              <span className="font-medium text-base-content italic truncate max-w-[200px]">{reason}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
            Se reintegrarán <strong>{refundBreakdown.totalReceiptItems} presentaciones</strong> {refundBreakdown.totalPhysicalItems !== refundBreakdown.totalReceiptItems ? `(${refundBreakdown.totalPhysicalItems} unidades físicas)` : ''} al inventario y se realizará una salida de caja de <strong className="text-error font-mono">{currency} {refundBreakdown.totalRefund.toFixed(2)}</strong>.
          </p>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-base-200">
            <BtnCancel 
              onClick={() => setShowConfirmModal(false)} 
              disabled={isSubmitting} 
              responsive={false}
              className="w-full sm:w-auto" />
            <BtnModalYes
              label="Sí, Procesar"
              onClick={handleSubmitReturn}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};


