// src/features/pos/components/CloseShiftModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import type { ShiftSummaryResponse } from '../types/pos';
import { useToast } from '../../../context/ToastContext';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Banknote, CreditCard, ArrowLeftRight, Wallet, QrCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftId: string | null;
  shiftSummary?: ShiftSummaryResponse | null;
}

interface PaymentItemRow {
  paymentCode: number;
  label: string;
  expectedAmount: number;
}

export const CloseShiftModal = ({ isOpen, onClose, onSuccess, shiftId, shiftSummary }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';

  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([DICTIONARIES.PAYMENT_TYPE]);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [counts, setCounts] = useState<Record<number, string>>({});
  const [observation, setObservation] = useState('');
  const [observationError, setObservationError] = useState<string | undefined>(undefined);

  const paymentItems: PaymentItemRow[] = useMemo(() => {
    if (shiftSummary?.payments && shiftSummary.payments.length > 0) {
      return shiftSummary.payments.map(p => ({
        paymentCode: Number(p.paymentType.code),
        label: p.paymentType.label,
        expectedAmount: Number(p.expectedAmount ?? 0)
      }));
    }

    const dictList = options[DICTIONARIES.PAYMENT_TYPE] || [];
    return dictList.map(pt => ({
      paymentCode: Number(pt.value),
      label: pt.label,
      expectedAmount: 0
    }));
  }, [shiftSummary, options]);

  useEffect(() => {
    if (isOpen) {
      setCounts({});
      setObservation('');
      setObservationError(undefined);
    }
  }, [isOpen, shiftSummary]);

  const getPaymentTypeIcon = (label: string, code: number) => {
    const l = label.toLowerCase();
    if (l.includes('efectivo') || code === 701) return Banknote;
    if (l.includes('qr') || code === 702) return QrCode;
    if (l.includes('tarjeta') || code === 703) return CreditCard;
    if (l.includes('transf') || code === 704) return ArrowLeftRight;
    return Wallet;
  };

  const handleCountChange = (paymentCode: number, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCounts(prev => ({
        ...prev,
        [paymentCode]: value
      }));
      if (observationError) {
        setObservationError(undefined);
      }
    }
  };

  const getCountedNumber = (code: number): number => {
    const val = counts[code];
    if (!val || val.trim() === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const hasAnyDifference = useMemo(() => {
    return paymentItems.some(p => {
      const c = getCountedNumber(p.paymentCode);
      const e = p.expectedAmount;
      return Math.abs(c - e) >= 0.01;
    });
  }, [paymentItems, counts]);

  const handleSubmit = async () => {
    if (!shiftId) return;

    if (hasAnyDifference && !observation.trim()) {
      setObservationError('Se requiere observación por descuadre en caja.');
      setShakeKey(prev => prev + 1);
      toastError('Se requiere observación al existir descuadre en caja.');
      return;
    }

    const details = paymentItems.map(p => ({
      paymentType: p.paymentCode,
      countedAmount: getCountedNumber(p.paymentCode)
    }));

    setIsLoading(true);
    try {
      await posService.closeShift(shiftId, {
        details,
        observation: observation.trim() || undefined
      });
      toastSuccess('Turno cerrado exitosamente.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error || '';
      if (status === 400 || apiMsg.toLowerCase().includes('observation')) {
        setObservationError('Se requiere observación por descuadre en caja.');
        toastError('Se requiere observación al existir descuadre en caja.');
      } else if (status === 409) {
        toastError('El turno no está abierto o ya fue cerrado.');
      } else if (apiMsg) {
        toastError(apiMsg);
      } else {
        toastError('No se pudo cerrar el turno.');
      }
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cierre de Turno"
      size="md"
      actions={
        <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
          <BtnCancel
            onClick={onClose}
            disabled={isLoading}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
          <BtnSave
            onClick={handleSubmit}
            label="Cerrar Turno"
            isLoading={isLoading}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* LISTADO MINIMALISTA DE MÉTODOS DE PAGO */}
        {isLoadingDicts ? (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paymentItems.map(p => {
              const IconComponent = getPaymentTypeIcon(p.label, p.paymentCode);
              const counted = getCountedNumber(p.paymentCode);
              const diff = counted - p.expectedAmount;
              const hasDiff = Math.abs(diff) >= 0.01;

              return (
                <div
                  key={p.paymentCode}
                  className="bg-base-200 p-3.5 sm:p-4 rounded-2xl border border-base-300 flex items-center justify-between gap-3 sm:gap-4 shadow-xs transition-colors"
                >
                  {/* Método: Ícono encapsulado en tarjeta blanca y Nombre en negrita */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-base-100 border border-base-300/80 shadow-xs text-primary flex items-center justify-center shrink-0">
                      <IconComponent size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base sm:text-lg text-base-content truncate leading-tight">
                        {p.label}
                      </p>
                    </div>
                  </div>

                  {/* Input de conteo físico */}
                  <div className="flex flex-col items-end shrink-0 w-32 sm:w-36">
                    <ComerziaInput
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="font-bold text-right text-base rounded-xl h-10 min-h-10 px-3 font-mono bg-base-100 border border-base-300 shadow-xs focus:border-primary"
                      value={counts[p.paymentCode] ?? ''}
                      onChange={e => handleCountChange(p.paymentCode, e.target.value)}
                      onClick={e => (e.target as HTMLInputElement).select()}
                      shakeKey={shakeKey}
                    />

                    {/* Diferencia ubicada debajo del input */}
                    {hasDiff && (
                      <span className={`text-xs font-mono font-bold mt-1.5 leading-tight ${diff < 0 ? 'text-error' : 'text-warning'}`}>
                        {currency} {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CAMPO DE OBSERVACIÓN */}
        <div className="pt-1">
          <ComerziaTextarea
            label="Observaciones"
            isRequired={hasAnyDifference}
            placeholder={
              hasAnyDifference
                ? "Justifica el faltante o sobrante de caja..."
                : "Notas adicionales sobre el cierre (opcional)..."
            }
            value={observation}
            onChange={e => setObservation(e.target.value)}
            error={observationError}
            shakeKey={shakeKey}
            rows={2}
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
