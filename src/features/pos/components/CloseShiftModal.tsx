import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import { useToast } from '../../../context/ToastContext';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftId: string | null;
}

export const CloseShiftModal = ({ isOpen, onClose, onSuccess, shiftId }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([DICTIONARIES.PAYMENT_TYPE]);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Mapeamos los IDs de payment_type al monto contado
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCounts({});
      setObservation('');
    }
  }, [isOpen]);

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
      toastSuccess("Turno cerrado.");
      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error || "";
      if (status === 400 || apiMsg.toLowerCase().includes("observation")) {
        toastError("Se requiere observación al existir descuadre en caja.");
      } else if (status === 409) {
        toastError("El turno no está abierto o ya fue cerrado.");
      } else if (apiMsg) {
        toastError(apiMsg);
      } else {
        toastError("No se pudo cerrar el turno.");
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
      <div className="space-y-4 pt-2">
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl text-sm">
          <p className="font-semibold text-warning-content mb-2">Instrucciones de Arqueo</p>
          <p className="text-base-content/80">
            Ingresa la cantidad exacta que tienes físicamente (o en el reporte de tarjetas). 
            Si existe algún descuadre con el sistema, se solicitará que llenes obligatoriamente la observación.
          </p>
        </div>

        {isLoadingDicts ? (
          <div className="flex justify-center p-4">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        ) : (
          <div className="space-y-3">
            {options[DICTIONARIES.PAYMENT_TYPE]?.map(pt => (
              <ComerziaInput
                key={pt.value}
                label={`Contado en ${pt.label}`}
                type="number"
                value={counts[pt.value] || ''}
                onChange={e => setCounts({...counts, [pt.value]: e.target.value})}
              />
            ))}
          </div>
        )}

        <ComerziaTextarea
          label="Observaciones (Requerido en caso de descuadre)"
          value={observation}
          onChange={e => setObservation(e.target.value)}
        />
      </div>
    </ComerziaModal>
  );
};
