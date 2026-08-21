import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import type { SaleResponse, SaleDetailResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BtnCancel, BtnModalYes, BtnSave } from '../../../components/ui/CrudButtons';
import { 
  Search, 
  ShieldAlert, 
  AlertTriangle, 
  FileText, 
  Receipt, 
  User, 
  Calendar, 
  ShoppingBag, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Info,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';

export const ReturnsPage = () => {
  const { saleNumber: routeSaleNumber } = useParams<{ saleNumber?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { userProfile } = useAuthStore();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [saleNumberInput, setSaleNumberInput] = useState('');
  const [activeSale, setActiveSale] = useState<SaleResponse | null>(null);
  const [isLoadingSale, setIsLoadingSale] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ title: string; message: string; type: 'warning' | 'error' | 'info' } | null>(null);

  // Formulario de Devolución
  const [reason, setReason] = useState('');
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({}); // saleDetailId -> quantityToReturn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

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
    // returnedQuantity ahora viene del backend en unidades físicas totales
    const returnedPhysical = detail.returnedQuantity ?? 0;
    const returnedReceipt = factor > 0 ? returnedPhysical / factor : 0;
    return Math.max(0, purchasedReceipt - returnedReceipt);
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

    try {
      const sale = await salesService.getSaleByNumber(term);
      const statusCode = getStatusCode(sale.saleStatus);

      // Validar si el estado permite devolución (602 COMPLETED o 605 PARTIALLY_REFUNDED)
      if (statusCode === 601) {
        setStatusNotice({
          title: "Venta Pendiente de Pago",
          message: "Esta venta aún no ha sido cobrada (estado PENDIENTE). No se pueden procesar devoluciones sobre ventas pendientes. Si deseas modificarla o cancelarla, hazlo desde la Terminal o Historial de Ventas.",
          type: "warning"
        });
        setActiveSale(sale);
      } else if (statusCode === 603) {
        setStatusNotice({
          title: "Venta Cancelada",
          message: "Esta venta fue CANCELADA antes de su pago. El inventario ya fue liberado previamente y no registra movimientos de caja.",
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
          message: "Esta venta ya fue devuelta en su totalidad (100% de los productos reingresados a inventario). No quedan ítems disponibles para devolver.",
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
      const msg = err.response?.data?.message || `No se encontró la venta con el número "${term}".`;
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

    setIsSubmitting(true);
    try {
      const payload = {
        reason: reason.trim(),
        returnDetails
      };

      await salesService.processReturn(activeSale.id, payload);
      toastSuccess("Devolución procesada y registrada exitosamente. Inventario y caja actualizados.");
      setShowConfirmModal(false);
      
      // Recargar la venta actualizada por número para reflejar nuevo estado (605 o 606)
      if (activeSale.saleNumber) {
        fetchSaleByNumber(activeSale.saleNumber);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || "Ocurrió un error al procesar la devolución.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refundBreakdown = calculateRefundBreakdown();
  const hasItemsToReturn = refundBreakdown.totalReceiptItems > 0;
  const isReturnable = activeSale && (getStatusCode(activeSale.saleStatus) === 602 || getStatusCode(activeSale.saleStatus) === 605);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/sales/history')} 
              className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              title="Volver al Historial de Ventas"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-base-content">
              Procesar Devoluciones de Venta
            </h1>
          </div>
          <p className="text-base-content/60 mt-1 ml-9">
            Reintegro de productos al inventario por lotes físicos y salida contable de dinero en caja
          </p>
        </div>
      </div>

      {/* Buscador de Venta por N° */}
      <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Introduce el N° de Venta (ej. VEN-000001, 10001)..."
              className="input input-bordered w-full pl-10 bg-base-50 focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
              value={saleNumberInput}
              onChange={(e) => setSaleNumberInput(e.target.value)}
            />
            {saleNumberInput && (
              <button
                type="button"
                onClick={() => { setSaleNumberInput(''); setActiveSale(null); setStatusNotice(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>
          <ComerziaButton
            type="submit"
            variant="primary"
            label="Buscar Venta"
            icon={<Search size={16} />}
            disabled={isLoadingSale || !saleNumberInput.trim()}
            isLoading={isLoadingSale}
            className="w-full sm:w-auto text-white font-bold"
          />
        </form>
      </div>

      {/* Alerta / Notificación de Estado No Retornable */}
      {statusNotice && (
        <div className={`p-4 rounded-2xl border flex gap-3 text-xs items-start animate-slide-up ${
          statusNotice.type === 'error' ? 'bg-error/10 border-error/20 text-error' :
          statusNotice.type === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' :
          'bg-info/10 border-info/20 text-info'
        }`}>
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">{statusNotice.title}</h4>
            <p className="leading-relaxed">{statusNotice.message}</p>
          </div>
        </div>
      )}

      {/* Contenido Principal de Devolución a Ancho Completo */}
      {activeSale && (
        <div className="space-y-6 animate-slide-up">
          {/* Ficha Resumen de la Venta */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                <Receipt size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Venta</span>
                  <h3 className="text-lg font-black font-mono text-primary">
                    #{activeSale.saleNumber || activeSale.id}
                  </h3>
                  <span className={`badge badge-sm font-semibold ${
                    getStatusCode(activeSale.saleStatus) === 602 ? 'badge-success text-white' :
                    getStatusCode(activeSale.saleStatus) === 605 ? 'badge-secondary text-white' :
                    getStatusCode(activeSale.saleStatus) === 606 ? 'badge-neutral' : 'badge-warning'
                  }`}>
                    {getStatusCode(activeSale.saleStatus) === 602 ? 'Completada' :
                     getStatusCode(activeSale.saleStatus) === 605 ? 'Dev. Parcial' :
                     getStatusCode(activeSale.saleStatus) === 606 ? 'Dev. Total' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-base-content/60 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {new Date(activeSale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={13} /> Cajero: <strong className="text-base-content font-bold">{activeSale.employeeUsername}</strong>
                  </span>
                  {activeSale.customer && (
                    <span className="flex items-center gap-1 text-primary">
                      <UserCheck size={13} /> Cliente: <strong>{activeSale.customer.fullName || activeSale.customer.firstName}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-base-200/50 px-4 py-2.5 rounded-xl border border-base-200 flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[11px] text-base-content/50 font-semibold uppercase block">Monto Original Venta</span>
                <span className="text-base font-extrabold font-mono text-base-content">
                  {currency} {(activeSale.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Grid de 2 Columnas Aprovechando Todo el Ancho */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Tabla de Productos (8 de 12 columnas) */}
            <div className="lg:col-span-8 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-base-200/60 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <FileText className="text-primary h-5 w-5" />
                    Ítems Facturados en la Venta
                  </h3>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Indica la cantidad a devolver por cada presentación respetando los factores y precios de compra.
                  </p>
                </div>

                {isReturnable && (
                  <ComerziaButton
                    variant="primary"
                    label="Devolver Todo Disponible"
                    icon={<RotateCcw size={14} />}
                    className="btn-xs shrink-0 font-bold"
                    onClick={handleSelectAllToReturn}
                  />
                )}
              </div>

              {/* Tabla de Productos de la Venta */}
              <div className="overflow-x-auto border border-base-200 rounded-xl">
                <table className="table table-compact w-full text-xs">
                  <thead>
                    <tr className="bg-base-200/60 text-base-content font-bold">
                      <th>Producto / Presentación</th>
                      <th className="text-center">Comprado</th>
                      <th className="text-right">Precio / Desc. Unit.</th>
                      <th className="text-center w-40">Cant. a Devolver</th>
                      <th className="text-right">Reembolso Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeSale.details || []).map((d: SaleDetailResponse) => {
                      const factor = d.equivalenceFactor || 1;
                      const purchasedQty = d.receiptQuantity ?? d.unitQuantity ?? 1;
                      const totalPurchasedPhysical = purchasedQty * factor;

                      // returnedQuantity viene en unidades físicas totales desde el backend
                      const totalReturnedPhysical = d.returnedQuantity ?? 0;
                      const alreadyReturnedReceipt = factor > 0 ? totalReturnedPhysical / factor : 0;

                      const maxQty = getMaxReturnQty(d);
                      const currentReturnQty = returnQtys[d.id] || 0;
                      const currentReturnPhysical = currentReturnQty * factor;

                      // Cálculos de línea y unitarios
                      const lineSuggested = d.lineTotalSuggested ?? (d.receiptUnitPrice ? d.receiptUnitPrice * purchasedQty : 0);
                      const lineDiscount = d.lineTotalDiscount ?? (d.unitDiscountAmount ? d.unitDiscountAmount * purchasedQty : 0);
                      const lineFinal = d.lineTotalFinal ?? (lineSuggested - lineDiscount);

                      const unitSuggested = purchasedQty > 0 ? lineSuggested / purchasedQty : (d.receiptUnitPrice ?? 0);
                      const unitDiscount = purchasedQty > 0 ? lineDiscount / purchasedQty : 0;
                      const unitFinal = purchasedQty > 0 ? lineFinal / purchasedQty : (unitSuggested - unitDiscount);

                      const lineFinalRefund = unitFinal * currentReturnQty;

                      return (
                        <tr key={d.id} className="hover:bg-base-50 transition-colors">
                          <td>
                            <div className="space-y-1">
                              <div>
                                <span className="font-bold block text-sm text-base-content leading-tight">
                                  {d.productName || 'Producto'}
                                </span>
                                {d.variantName && (
                                  <span className="text-xs text-base-content/70 font-medium block">
                                    {d.variantName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {d.measureUnitName && (
                                  <span className="badge badge-ghost badge-xs font-medium">
                                    {d.measureUnitName}
                                  </span>
                                )}
                                {factor > 1 && (
                                  <span className="badge badge-info badge-xs text-white font-bold">
                                    Factor x{factor}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="font-semibold text-base-content whitespace-nowrap">
                              {purchasedQty} {d.measureUnitName || ''} {factor > 1 && <span className="text-[11px] text-base-content/60 font-medium">({totalPurchasedPhysical} u)</span>}
                            </div>
                            {totalReturnedPhysical > 0 && (
                              <div className="badge badge-warning badge-xs mt-1 font-semibold whitespace-nowrap">
                                {alreadyReturnedReceipt} devueltos {factor > 1 ? `(${totalReturnedPhysical} u)` : ''}
                              </div>
                            )}
                          </td>
                          <td className="text-right font-mono">
                            <div className="text-base-content/80 font-medium">
                              {currency} {unitSuggested.toFixed(2)}
                            </div>
                            {unitDiscount > 0 && (
                              <div className="text-[11px] text-error font-semibold">
                                -{currency} {unitDiscount.toFixed(2)} desc.
                              </div>
                            )}
                            <div className="text-xs font-bold text-primary">
                              Neto: {currency} {unitFinal.toFixed(2)}
                            </div>
                          </td>
                          <td className="text-center">
                            {isReturnable && maxQty > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxQty}
                                    className="input input-bordered input-xs w-16 text-center font-bold font-mono"
                                    value={currentReturnQty}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(maxQty, parseInt(e.target.value) || 0));
                                      setReturnQtys({ ...returnQtys, [d.id]: val });
                                    }}
                                  />
                                  <span className="text-base-content/50 text-[11px] font-semibold">/ {maxQty}</span>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs text-[10px] text-primary px-1 hover:underline cursor-pointer"
                                    onClick={() => setReturnQtys({ ...returnQtys, [d.id]: maxQty })}
                                    title={`Devolver todo lo disponible (${maxQty} ${d.measureUnitName || 'u.'})`}
                                  >
                                    Máx
                                  </button>
                                </div>
                                {factor > 1 && currentReturnQty > 0 && (
                                  <span className="text-[10px] text-primary font-bold">
                                    ({currentReturnPhysical} unidades)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="badge badge-neutral badge-xs font-semibold">
                                {maxQty === 0 ? '100% Devuelto' : 'No disponible'}
                              </span>
                            )}
                          </td>
                          <td className="text-right font-mono font-bold">
                            {lineFinalRefund > 0 ? (
                              <span className="text-error font-extrabold text-sm">
                                -{currency} {lineFinalRefund.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-base-content/40">0.00</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Columna Derecha: Resumen de Reembolso y Confirmación (4 de 12 columnas) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                  <ShoppingBag size={20} className="text-secondary" />
                  Resumen de Reembolso
                </h3>

                {/* Desglose Numérico */}
                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-base-content/70">
                    <span>Ítems seleccionados a devolver:</span>
                    <div className="text-right">
                      <strong className="text-base-content block">{refundBreakdown.totalReceiptItems} productos</strong>
                      {refundBreakdown.totalPhysicalItems !== refundBreakdown.totalReceiptItems && (
                        <span className="text-[11px] text-primary font-bold">
                          ({refundBreakdown.totalPhysicalItems} unidades)
                        </span>
                      )}
                    </div>
                  </div>

                  {refundBreakdown.discountRefund > 0 && (
                    <>
                      <div className="flex justify-between items-center text-base-content/70">
                        <span>Subtotal de lista reembolsado:</span>
                        <span className="font-mono font-medium">{currency} {refundBreakdown.subtotalRefund.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-error font-medium">
                        <span>Descuentos deducidos del reembolso:</span>
                        <span className="font-mono font-bold">-{currency} {refundBreakdown.discountRefund.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-base-200/60 font-mono text-sm">
                    <span className="font-bold text-base-content">Total Neto a Reembolsar:</span>
                    <span className="text-xl font-black text-error">
                      - {currency} {refundBreakdown.totalRefund.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Motivo de Devolución */}
                {isReturnable && (
                  <div className="space-y-4">
                    <ComerziaInput
                      label="Motivo de la Devolución"
                      placeholder="Ej. Producto defectuoso, error en pedido del cliente..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      isRequired
                      shakeKey={shakeKey}
                      error={!reason.trim() && shakeKey > 0 ? "El motivo es obligatorio" : ""}
                    />

                    {/* Advertencia Legal / Contable */}
                    <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex gap-3 text-xs text-error">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">ADVERTENCIA:</span> Esta acción reingresará el stock seleccionado a los lotes físicos originales y registrará la salida del dinero de la caja registradora activa.
                      </div>
                    </div>

                    <ComerziaButton
                      variant="delete"
                      label="Confirmar Devolución"
                      fullWidth
                      disabled={!hasItemsToReturn || !reason.trim() || isSubmitting}
                      onClick={() => setShowConfirmModal(true)}
                      className="text-white font-bold py-3 shadow-md shadow-error/20"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Final */}
      <ComerziaModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmación de Devolución"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle size={32} />
            <div>
              <p className="font-semibold text-lg">¿Procesar esta devolución?</p>
              <p className="text-xs text-base-content/60">Venta #{activeSale?.saleNumber}</p>
            </div>
          </div>
          <p className="text-sm text-base-content/70 leading-relaxed">
            Se reintegrarán <strong>{refundBreakdown.totalReceiptItems} presentaciones</strong> {refundBreakdown.totalPhysicalItems !== refundBreakdown.totalReceiptItems ? `(${refundBreakdown.totalPhysicalItems} unidades físicas)` : ''} al inventario y se realizará una salida de caja de <strong className="text-error">{currency} {refundBreakdown.totalRefund.toFixed(2)}</strong>.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setShowConfirmModal(false)} disabled={isSubmitting} />
            <BtnModalYes
              label="Sí, Procesar Devolución"
              onClick={handleSubmitReturn}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
