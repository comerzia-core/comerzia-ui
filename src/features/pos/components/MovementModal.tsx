import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import { useToast } from '../../../context/ToastContext';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import type { MovementResponse } from '../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftId?: string;
  movementToEdit?: MovementResponse | null;
}

export const MovementModal = ({ isOpen, onClose, onSuccess, shiftId, movementToEdit }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([
    DICTIONARIES.MOVEMENT_TYPE, 
    DICTIONARIES.PAYMENT_TYPE
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState({
    movementType: '',
    paymentType: '',
    amount: '',
    observation: ''
  });

  const [selectedShiftId, setSelectedShiftId] = useState(shiftId || '');
  const [activeShifts, setActiveShifts] = useState<{value: string, label: string}[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!shiftId && !movementToEdit) {
        loadActiveShifts();
      }
      if (movementToEdit) {
        setForm({
          movementType: String(movementToEdit.movementType.code),
          paymentType: String(movementToEdit.paymentType.code),
          amount: String(movementToEdit.amount),
          observation: movementToEdit.observation || ''
        });
        setSelectedShiftId(movementToEdit.shiftId);
      } else {
        setForm({
          movementType: '',
          paymentType: '',
          amount: '',
          observation: ''
        });
        setSelectedShiftId(shiftId || '');
      }
    }
  }, [isOpen, movementToEdit, shiftId]);

  const loadActiveShifts = async () => {
    setIsLoadingShifts(true);
    try {
      const data = await posService.getAllActiveShiftSummaries();
      setActiveShifts(data.map(s => ({ 
        value: s.id, 
        label: `${s.cashName} (${s.employeeName}) - ${s.branchName}` 
      })));
    } catch {
      toastError("Error al cargar turnos activos.");
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const handleSubmit = async () => {
    const finalShiftId = shiftId || selectedShiftId;
    if (!form.movementType || !form.paymentType || !form.amount || (!movementToEdit && !finalShiftId)) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      if (movementToEdit) {
        await posService.updateMovement(movementToEdit.id, {
          movementType: Number(form.movementType),
          paymentType: Number(form.paymentType),
          amount: Number(form.amount),
          observation: form.observation || undefined
        });
        toastSuccess("Movimiento actualizado.");
      } else {
        await posService.createMovement({
          shiftId: finalShiftId,
          movementType: Number(form.movementType),
          paymentType: Number(form.paymentType),
          amount: Number(form.amount),
          observation: form.observation || undefined
        });
        toastSuccess("Movimiento registrado.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error || "";
      if (status === 409) {
        toastError("El turno asociado ya se encuentra cerrado.");
      } else if (apiMsg) {
        toastError(apiMsg);
      } else {
        toastError("No se pudo guardar el movimiento.");
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
      title={movementToEdit ? "Editar Movimiento" : "Nuevo Movimiento de Caja"}
      size="md"
      actions={
        <div className="flex justify-end gap-2 w-full mt-4">
          <BtnCancel onClick={onClose} disabled={isLoading} />
          <BtnSave onClick={handleSubmit} isLoading={isLoading} />
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        {!shiftId && !movementToEdit && (
          <ComerziaSelect
            label="Caja (Turno Activo)"
            options={activeShifts}
            value={selectedShiftId}
            onChange={e => setSelectedShiftId(e.target.value)}
            isLoading={isLoadingShifts}
            enableDefaultOption
            isRequired
            shakeKey={shakeKey}
            error={!selectedShiftId && shakeKey > 0 ? "Requerido" : ""}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <ComerziaSelect
            label="Tipo de Movimiento"
            options={options[DICTIONARIES.MOVEMENT_TYPE] || []}
            value={form.movementType}
            onChange={e => setForm({...form, movementType: e.target.value})}
            isLoading={isLoadingDicts}
            enableDefaultOption
            isRequired
            shakeKey={shakeKey}
            error={!form.movementType && shakeKey > 0 ? "Requerido" : ""}
          />

          <ComerziaSelect
            label="Método de Pago"
            options={options[DICTIONARIES.PAYMENT_TYPE] || []}
            value={form.paymentType}
            onChange={e => setForm({...form, paymentType: e.target.value})}
            isLoading={isLoadingDicts}
            enableDefaultOption
            isRequired
            shakeKey={shakeKey}
            error={!form.paymentType && shakeKey > 0 ? "Requerido" : ""}
          />
        </div>

        <ComerziaInput
          label="Monto"
          type="number"
          value={form.amount}
          onChange={e => setForm({...form, amount: e.target.value})}
          isRequired
          shakeKey={shakeKey}
          error={!form.amount && shakeKey > 0 ? "Requerido" : ""}
        />

        <ComerziaTextarea
          label="Motivo u Observación"
          value={form.observation}
          onChange={e => setForm({...form, observation: e.target.value})}
        />
      </div>
    </ComerziaModal>
  );
};
