import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { salesService } from '../services/salesService';
import type { SaleResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Banknote, CreditCard, QrCode, Landmark, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponse | null;
  shiftId: string;
  onPaymentSuccess: (saleId: string, saleNumber?: string) => void;
}

export const PaySaleModal = ({ isOpen, onClose, sale, shiftId, onPaymentSuccess }: Props) => {
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';
  const { error: toastError, success: toastSuccess } = useToast();

  const [paymentType, setPaymentType] = useState<number>(701); // 701 = Cash by default
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && sale) {
      setPaymentType(701);
      setAmountPaid(sale.totalAmount);
    }
  }, [isOpen, sale]);

  if (!sale) return null;

  const totalAmount = sale.totalAmount;
  const numPaid = typeof amountPaid === 'number' ? amountPaid : 0;
  const changeAmount = paymentType === 701 && numPaid > totalAmount ? numPaid - totalAmount : 0;

  const handleSelectPaymentType = (type: number) => {
    setPaymentType(type);
    if (type !== 701 && sale) {
      setAmountPaid(sale.totalAmount);
    }
  };

  const handlePay = async () => {
    if (!amountPaid || numPaid <= 0) {
      setShakeKey(prev => prev + 1);
      toastError("Ingresa un monto de pago válido.");
      return;
    }

    if (numPaid < totalAmount) {
      setShakeKey(prev => prev + 1);
      toastError(`El monto ingresado es menor al total de la venta (${currencyCode} ${totalAmount.toFixed(2)}).`);
      return;
    }

    if (!shiftId) {
      toastError("No se encontró un turno activo para procesar el pago.");
      return;
    }

    setIsSubmitting(true);
    try {
      await salesService.processPayment(sale.id, {
        shiftId,
        payments: [
          {
            paymentType,
            amount: numPaid
          }
        ]
      });

      toastSuccess("Cobro procesado exitosamente.");
      const paidSaleId = sale.id;
      const paidSaleNumber = sale.saleNumber;
      onClose();
      onPaymentSuccess(paidSaleId, paidSaleNumber);
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Error al procesar el pago.";
      toastError(msg);
      setShakeKey(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    { type: 701, label: 'Efectivo', icon: Banknote, color: 'text-success bg-success/10 border-success/30 hover:bg-success/20' },
    { type: 702, label: 'QR / Transferencia', icon: QrCode, color: 'text-warning bg-warning/10 border-warning/30 hover:bg-warning/20' },
    { type: 703, label: 'Tarjeta', icon: CreditCard, color: 'text-info bg-info/10 border-info/30 hover:bg-info/20' },
    { type: 704, label: 'Transferencia', icon: Landmark, color: 'text-secondary bg-secondary/10 border-secondary/30 hover:bg-secondary/20' }
  ];

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Procesar Cobro ${sale.saleNumber ? `- Venta #${sale.saleNumber}` : ''}`}
      size="lg"
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

        {/* Método de Pago Selector */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-2">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = paymentType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelectPaymentType(opt.type)}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected 
                      ? `${opt.color} ring-2 ring-primary border-primary shadow-xs scale-[1.02]` 
                      : 'border-base-200 bg-base-100 hover:border-base-300 text-base-content/70'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="font-bold text-[11px] text-center leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 bg-base-100 p-3.5 rounded-xl border border-base-200">
          <ComerziaInput
            label={`Monto Recibido (${currencyCode})`}
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value !== '' ? Number(e.target.value) : '')}
            error={shakeKey > 0 && (!amountPaid || numPaid < totalAmount) ? "Monto insuficiente o inválido" : ""}
            shakeKey={shakeKey}
            isRequired
            disabled={paymentType !== 701}
          />

          {paymentType === 701 && changeAmount > 0 && (
            <div className="p-3 bg-success/15 border border-success/30 rounded-xl flex items-center justify-between gap-2 animate-fade-in text-xs sm:text-sm">
              <span className="font-semibold text-success flex items-center gap-1.5">
                <CheckCircle size={15} className="shrink-0" /> Cambio / Vuelto:
              </span>
              <span className="text-base sm:text-lg font-bold text-success font-mono">
                {currencyCode} {changeAmount.toFixed(2)}
              </span>
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
