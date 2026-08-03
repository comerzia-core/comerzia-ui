// src/features/pos/components/CloseShiftModal.tsx
import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import { useToast } from '../../../context/ToastContext';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Banknote, CreditCard, ArrowLeftRight, Wallet, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftId: string | null;
}

export const CloseShiftModal = ({ isOpen, onClose, onSuccess, shiftId }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';

  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([DICTIONARIES.PAYMENT_TYPE]);

  const [isLoading, setIsLoading] = useState(false);
  const [, setShakeKey] = useState(0);

  // Mapeamos los IDs de payment_type al monto contado (valor por defecto 0)
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (isOpen) {
      const paymentTypes = options[DICTIONARIES.PAYMENT_TYPE] || [];
      const initialCounts: Record<string, string> = {};
      paymentTypes.forEach(pt => {
        initialCounts[pt.value] = '0';
      });
      setCounts(initialCounts);
      setObservation('');
    }
  }, [isOpen, options]);

  const getPaymentTypeIcon = (label: string, value: string | number) => {
    const l = label.toLowerCase();
    const v = String(value);
    if (l.includes('efectivo') || v === '701') return Banknote;
    if (l.includes('tarjeta') || v === '702') return CreditCard;
    if (l.includes('transf') || v === '703') return ArrowLeftRight;
    return Wallet;
  };

  const handleSubmit = async () => {
    const paymentTypes = options[DICTIONARIES.PAYMENT_TYPE] || [];
    const details = paymentTypes.map(pt => ({
      paymentType: Number(pt.value),
      countedAmount: Number(counts[pt.value] || 0)
    }));

    if (!shiftId) return;

    setIsLoading(true);
    try {
      await posService.closeShift(shiftId, {
        details,
        observation: observation || undefined
      });
      toastSuccess('Turno cerrado.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error || '';
      if (status === 400 || apiMsg.toLowerCase().includes('observation')) {
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
      title="Arqueo y Cierre de Caja"
      size="md"
      actions={
        <div className="flex justify-end gap-2 w-full mt-4">
          <BtnCancel onClick={onClose} disabled={isLoading} />
          <BtnSave onClick={handleSubmit} label="Cerrar Turno" isLoading={isLoading} />
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        {/* Banner Informativo */}
        <div className="bg-primary/5 border border-primary/15 p-4 rounded-2xl flex items-start gap-3 text-sm">
          <Info size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-base-content mb-1">Instrucciones de Arqueo</p>
            <p className="text-base-content/75 text-xs leading-relaxed">
              Ingresa el dinero en efectivo y totales de cupones/tarjetas contados físicamente en caja. 
              En caso de encontrarse un descuadre respecto al sistema, completa obligatoriamente la observación.
            </p>
          </div>
        </div>

        {/* Listado de Formas de Pago con Diseño Filas (Izquierda: Tipo, Derecha: Monto) */}
        {isLoadingDicts ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : (
          <div className="space-y-3">
            {options[DICTIONARIES.PAYMENT_TYPE]?.map(pt => {
              const IconComponent = getPaymentTypeIcon(pt.label, pt.value);
              return (
                <div
                  key={pt.value}
                  className="bg-base-100 p-4 rounded-2xl border border-base-200 hover:border-primary/30 flex items-center justify-between gap-4 transition-all shadow-xs"
                >
                  {/* LADO IZQUIERDO: Ícono e Identificador del Método de Pago */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <IconComponent size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-base-content truncate">{pt.label}</p>
                      <p className="text-xs text-base-content/50 font-medium truncate">
                        Conteo físico en caja ({currency})
                      </p>
                    </div>
                  </div>

                  {/* LADO DERECHO: Campo de Monto (Por defecto 0, usando componente del UI Kit) */}
                  <div className="w-40 sm:w-48 shrink-0 relative flex items-center">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-base-content/50 pointer-events-none select-none z-10">
                      {currency}
                    </span>
                    <ComerziaInput
                      type="number"
                      min="0"
                      step="any"
                      className="pl-8 pr-3 font-extrabold text-right text-base rounded-xl"
                      value={counts[pt.value] ?? '0'}
                      onChange={e => setCounts({ ...counts, [pt.value]: e.target.value })}
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Observación Requerida en Descuadre */}
        <ComerziaTextarea
          label="Observaciones (Requerido en caso de descuadre)"
          value={observation}
          onChange={e => setObservation(e.target.value)}
        />
      </div>
    </ComerziaModal>
  );
};
