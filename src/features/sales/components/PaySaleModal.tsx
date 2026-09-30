import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { salesService } from '../services/salesService';
import type { SaleResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { Banknote, QrCode, Split, CheckCircle, ImageOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponse | null;
  shiftId: string;
  onPaymentSuccess: (saleId: string, saleNumber?: string) => void;
}

type PaymentMode = 'CASH' | 'QR' | 'MIXED';

export const PaySaleModal = ({ isOpen, onClose, sale, shiftId, onPaymentSuccess }: Props) => {
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';
  const companyQrUrl = userProfile?.companySettings?.companyQrUrl;
  const { error: toastError, success: toastSuccess } = useToast();

  const { options: dictOptions } = useLoadDictionaries([DICTIONARIES.PAYMENT_TYPE]);
  const paymentTypeOptions = dictOptions[DICTIONARIES.PAYMENT_TYPE] || [];

  // Modo de cobro seleccionado: Efectivo (701), QR (702) o Mixto (Efectivo + QR)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');

  // Montos ingresados
  const [cashAmount, setCashAmount] = useState<number | ''>('');
  const [qrAmount, setQrAmount] = useState<number | ''>('');

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicialización al abrir modal
  useEffect(() => {
    if (isOpen && sale) {
      setPaymentMode('CASH');
      setCashAmount(sale.totalAmount);
      setQrAmount('');
    }
  }, [isOpen, sale]);

  if (!sale) return null;

  const totalAmount = sale.totalAmount;
  const numCash = typeof cashAmount === 'number' ? cashAmount : 0;
  const numQr = typeof qrAmount === 'number' ? qrAmount : 0;

  // Cálculos de Cobertura y Vuelto según el Modo
  let isFullyCovered = false;
  let changeAmount = 0;
  let qrApplied = 0;
  let cashApplied = 0;
  let pendingBalance = 0;

  if (paymentMode === 'CASH') {
    isFullyCovered = numCash >= totalAmount && numCash > 0;
    changeAmount = numCash > totalAmount ? Number((numCash - totalAmount).toFixed(2)) : 0;
    cashApplied = totalAmount;
    pendingBalance = Math.max(0, Number((totalAmount - numCash).toFixed(2)));
  } else if (paymentMode === 'QR') {
    isFullyCovered = true; // El QR es por el 100% exacto
    changeAmount = 0; // Con QR jamás damos cambio
    qrApplied = totalAmount;
    pendingBalance = 0;
  } else if (paymentMode === 'MIXED') {
    // En MIXED:
    // QR es digital exacto (no genera vuelto por sí solo y no puede exceder el total)
    qrApplied = Math.min(numQr, totalAmount);
    const remainingForCash = Math.max(0, Number((totalAmount - qrApplied).toFixed(2)));
    const totalCovered = Number((qrApplied + numCash).toFixed(2));
    isFullyCovered = totalCovered >= totalAmount && (numCash > 0 || qrApplied > 0);
    // El vuelto se da SOLO sobre el efectivo que exceda la porción no cubierta por QR
    changeAmount = numCash > remainingForCash ? Number((numCash - remainingForCash).toFixed(2)) : 0;
    cashApplied = Number(Math.min(numCash, remainingForCash).toFixed(2));
    pendingBalance = Math.max(0, Number((totalAmount - (qrApplied + cashApplied)).toFixed(2)));
  }

  // Cambio de modo de pago con inicializaciones lógicas
  const handleSelectMode = (mode: PaymentMode) => {
    setPaymentMode(mode);

    if (mode === 'CASH') {
      setCashAmount(totalAmount);
      setQrAmount('');
    } else if (mode === 'QR') {
      setQrAmount(totalAmount);
      setCashAmount('');
    } else if (mode === 'MIXED') {
      // Por defecto en mixto sugerimos 50% o dejamos que el usuario distribuya
      setQrAmount('');
      setCashAmount('');
    }
  };

  // Manejo de cambio en QR en modo MIXED
  const handleQrChangeMixed = (val: number | '') => {
    if (val === '') {
      setQrAmount('');
      return;
    }
    const valNum = Number(val);
    if (valNum > totalAmount) {
      setQrAmount(totalAmount);
      toastError(`El monto en QR no puede ser mayor al total de la venta (${currencyCode} ${totalAmount.toFixed(2)}).`);
      return;
    }
    setQrAmount(valNum);
  };

  const handlePay = async () => {
    if (paymentMode === 'MIXED' && numQr > totalAmount) {
      setShakeKey(prev => prev + 1);
      toastError(`El monto en QR (${currencyCode} ${numQr.toFixed(2)}) no puede exceder el total de la venta (${currencyCode} ${totalAmount.toFixed(2)}).`);
      return;
    }

    if (!isFullyCovered) {
      setShakeKey(prev => prev + 1);
      toastError(`El monto cubierto es insuficiente para completar el cobro de ${currencyCode} ${totalAmount.toFixed(2)}.`);
      return;
    }

    if (!shiftId) {
      toastError("No se encontró un turno activo para procesar el pago.");
      return;
    }

    const paymentsToSend: { paymentType: number; amount: number }[] = [];

    if (paymentMode === 'CASH') {
      paymentsToSend.push({
        paymentType: 701,
        amount: numCash
      });
    } else if (paymentMode === 'QR') {
      paymentsToSend.push({
        paymentType: 702,
        amount: totalAmount
      });
    } else if (paymentMode === 'MIXED') {
      if (numQr > 0) {
        paymentsToSend.push({
          paymentType: 702,
          amount: numQr
        });
      }
      if (numCash > 0) {
        paymentsToSend.push({
          paymentType: 701,
          amount: numCash
        });
      }
    }

    if (paymentsToSend.length === 0) {
      toastError("Ingresa al menos un monto de pago válido.");
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await salesService.processPayment(sale.id, {
        shiftId,
        payments: paymentsToSend
      });

      toastSuccess("Cobro procesado exitosamente.");
      const paidSaleId = sale.id;
      const paidSaleNumber = sale.saleNumber;
      onClose();
      onPaymentSuccess(paidSaleId, paidSaleNumber);
    } catch (e: any) {
      console.error(e);
      const status = e.response?.status;
      const serverMsg = e.response?.data?.message;

      let errorMsg = "Error al procesar el pago.";

      if (status === 400) {
        errorMsg = serverMsg || "Monto insuficiente o pago digital excede el total.";
      } else if (status === 403) {
        errorMsg = "El turno activo pertenece a otro cajero.";
      } else if (status === 404) {
        errorMsg = "No se encontró la venta o el turno de caja.";
      } else if (status === 409) {
        errorMsg = "La venta ya no se encuentra pendiente de cobro.";
      } else if (serverMsg) {
        errorMsg = serverMsg;
      }

      toastError(errorMsg);
      setShakeKey(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener etiquetas desde diccionarios si existen
  const cashLabel = paymentTypeOptions.find(o => String(o.value) === '701')?.label || 'Efectivo';
  const qrLabel = paymentTypeOptions.find(o => String(o.value) === '702')?.label || 'QR';

  const paymentModes = [
    {
      key: 'CASH' as PaymentMode,
      label: cashLabel,
      icon: Banknote,
      color: 'text-success bg-success/10 border-success/30 hover:bg-success/20'
    },
    {
      key: 'QR' as PaymentMode,
      label: qrLabel,
      icon: QrCode,
      color: 'text-warning bg-warning/10 border-warning/30 hover:bg-warning/20'
    },
    {
      key: 'MIXED' as PaymentMode,
      label: 'Mixto',
      icon: Split,
      color: 'text-primary bg-primary/10 border-primary/30 hover:bg-primary/20'
    }
  ];

  const showQrSection = paymentMode === 'QR' || paymentMode === 'MIXED';

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Procesar Cobro ${sale.saleNumber ? `- Venta #${sale.saleNumber}` : ''}`}
      size={showQrSection ? "xl" : "lg"}
    >
      <div className="space-y-4 sm:space-y-5 pt-1">
        {/* Total Summary */}
        <div className="bg-primary/10 border border-primary/20 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider block">Monto a Cobrar</span>
            <h3 className="text-xl sm:text-2xl font-black text-primary font-mono mt-0.5">
              {currencyCode} {totalAmount.toFixed(2)}
            </h3>
          </div>
          {sale.details && (
            <div className="text-right text-xs text-base-content/60">
              <p className="font-medium">{sale.details.length} {sale.details.length === 1 ? 'producto' : 'productos'}</p>
              {sale.discountedAmount > 0 && (
                <p className="text-error font-semibold text-[11px]">Desc: -{currencyCode} {sale.discountedAmount.toFixed(2)}</p>
              )}
            </div>
          )}
        </div>

        {/* Selector de Método de Pago Superior (Siempre arriba en PC y Mobile) */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-2">
            Método de Pago
          </label>
          <div className="grid grid-cols-3 gap-2">
            {paymentModes.map((opt) => {
              const Icon = opt.icon;
              const isSelected = paymentMode === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelectMode(opt.key)}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected 
                      ? `${opt.color} ring-2 ring-primary border-primary shadow-xs scale-[1.01]` 
                      : 'border-base-200 bg-base-100 hover:border-base-300 text-base-content/70'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="font-bold text-[11px] sm:text-xs leading-tight text-center">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sección de Formularios y Código QR según Modo */}
        <div className={`grid gap-4 ${showQrSection ? 'grid-cols-1 lg:grid-cols-12 items-start' : 'grid-cols-1'}`}>
          
          {/* Columna Izquierda: Entradas de Pago */}
          <div className={showQrSection ? 'lg:col-span-5 space-y-3.5' : 'space-y-3.5'}>
            {/* CASO 1: EFECTIVO (100% Efectivo con Cálculo de Vuelto) */}
            {paymentMode === 'CASH' && (
              <div className="space-y-3.5 bg-base-200/40 p-4 rounded-2xl border border-base-300 shadow-xs animate-fade-in">
                <ComerziaInput
                  label={`Efectivo Recibido (${currencyCode})`}
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                  error={shakeKey > 0 && (!cashAmount || numCash < totalAmount) ? "Monto insuficiente" : ""}
                  shakeKey={shakeKey}
                  isRequired
                />

                {changeAmount > 0 && (
                  <div className="p-3.5 sm:p-4 bg-success/15 border-2 border-success/30 rounded-2xl flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                    <span className="font-bold text-success text-sm sm:text-base flex items-center gap-2">
                      <CheckCircle size={20} className="shrink-0 text-success" /> Cambio:
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-success font-mono tracking-tight">
                      {currencyCode} {changeAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CASO 2: QR (100% QR sin cambio) */}
            {paymentMode === 'QR' && null}

            {/* CASO 3: MIXTO (Efectivo + QR) */}
            {paymentMode === 'MIXED' && (
              <div className="space-y-3.5 bg-base-200/40 p-4 rounded-2xl border border-base-300 shadow-xs animate-fade-in">
                {/* Input Monto QR */}
                <ComerziaInput
                  label={`Monto en QR (${currencyCode})`}
                  type="number"
                  placeholder="0.00"
                  value={qrAmount}
                  onChange={(e) => handleQrChangeMixed(e.target.value !== '' ? Number(e.target.value) : '')}
                  error={shakeKey > 0 && numQr > totalAmount ? `Máximo ${currencyCode} ${totalAmount.toFixed(2)}` : ''}
                  shakeKey={shakeKey}
                />

                {/* Input Efectivo Recibido */}
                <ComerziaInput
                  label={`Efectivo Recibido (${currencyCode})`}
                  type="number"
                  placeholder="0.00"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                  shakeKey={shakeKey}
                />

                {/* Vuelto generado sobre el efectivo */}
                {changeAmount > 0 && (
                  <div className="p-3.5 bg-success/15 border-2 border-success/30 rounded-2xl flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                    <span className="font-bold text-success text-sm sm:text-base flex items-center gap-2">
                      <CheckCircle size={20} className="shrink-0 text-success" /> Cambio:
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-success font-mono tracking-tight">
                      {currencyCode} {changeAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Alerta de saldo pendiente / falta cubrir */}
                {pendingBalance > 0 && (
                  <div className="p-3.5 bg-error/10 border-2 border-error/25 rounded-2xl flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                    <span className="font-bold text-error text-xs sm:text-sm uppercase tracking-wide">
                      Falta cubrir:
                    </span>
                    <span className="text-lg sm:text-xl font-black text-error font-mono tracking-tight">
                      {currencyCode} {pendingBalance.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Tarjeta del QR cuando aplica (QR o MIXED) */}
          {showQrSection && (
            <div className={`${paymentMode === 'QR' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-base-200/40 p-4 sm:p-5 rounded-2xl border-2 border-warning/30 shadow-sm flex flex-col items-center justify-center gap-3 animate-fade-in text-center h-full`}>
              {companyQrUrl ? (
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-base-300 shadow-md inline-flex items-center justify-center">
                  <img
                    src={companyQrUrl}
                    alt="QR de Cobro"
                    className="w-52 h-52 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 max-h-[42vh] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="py-8 px-4 w-full bg-base-100 rounded-2xl border border-dashed border-base-300 flex flex-col items-center gap-2 text-base-content/50">
                  <ImageOff size={36} className="text-base-content/30" />
                  <p className="text-xs sm:text-sm font-bold text-base-content/70">No hay código QR configurado</p>
                  <p className="text-[11px] max-w-xs leading-tight">Puedes registrar el QR en Perfil de la Empresa.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-row items-center gap-2 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel
            onClick={onClose}
            disabled={isSubmitting}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
          <BtnSave
            onClick={handlePay}
            label="Confirmar Pago"
            isLoading={isSubmitting}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
