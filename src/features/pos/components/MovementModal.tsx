// src/features/pos/components/MovementModal.tsx
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
import { useAuthStore } from '../../../stores/useAuthStore';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
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
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';

  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([
    DICTIONARIES.PAYMENT_TYPE
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState({
    movementType: '201', // 201: INFLOW (Ingreso), 202: OUTFLOW (Egreso)
    paymentType: '',
    amount: '',
    observation: ''
  });

  const [selectedShiftId, setSelectedShiftId] = useState(shiftId || '');
  const [activeShifts, setActiveShifts] = useState<{ value: string; label: string }[]>([]);
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
          movementType: '201',
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
      setActiveShifts(
        data.map(s => ({
          value: s.id,
          label: `${s.cashName} (${s.employeeName}) - ${s.branchName}`
        }))
      );
    } catch {
      toastError('Error al cargar turnos activos.');
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
        toastSuccess('Movimiento actualizado.');
      } else {
        await posService.createMovement({
          shiftId: finalShiftId,
          movementType: Number(form.movementType),
          paymentType: Number(form.paymentType),
          amount: Number(form.amount),
          observation: form.observation || undefined
        });
        toastSuccess('Movimiento registrado.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error || '';
      if (status === 409) {
        toastError('El turno asociado ya se encuentra cerrado.');
      } else if (apiMsg) {
        toastError(apiMsg);
      } else {
        toastError('No se pudo guardar el movimiento.');
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
      title={movementToEdit ? 'Editar Movimiento' : 'Nuevo Movimiento de Caja'}
      size="md"
      actions={
        <div className="flex flex-row items-center gap-2 w-full sm:justify-end mt-4">
          <BtnCancel onClick={onClose} disabled={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          <BtnSave onClick={handleSubmit} isLoading={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        </div>
      }
    >
      <div className="space-y-5 pt-2">
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
            error={!selectedShiftId && shakeKey > 0 ? 'Requerido' : ''}
          />
        )}

        {/* Selector de Tipo (Ingreso / Egreso) */}
        <div>
          <label className="label">
            <span className="label-text font-semibold text-base-content/80">
              Tipo de Movimiento <span className="text-error">*</span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* INGRESO (201) */}
            <button
              type="button"
              onClick={() => setForm({ ...form, movementType: '201' })}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                form.movementType === '201'
                  ? 'border-success bg-success/10 text-success shadow-xs'
                  : 'border-base-300 hover:border-base-content/20 text-base-content/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  form.movementType === '201' ? 'bg-success text-success-content' : 'bg-base-200'
                }`}
              >
                <ArrowDownRight size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Ingreso</div>
                <div className="text-xs opacity-75">Entrada de dinero</div>
              </div>
            </button>

            {/* EGRESO (202) */}
            <button
              type="button"
              onClick={() => setForm({ ...form, movementType: '202' })}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                form.movementType === '202'
                  ? 'border-error bg-error/10 text-error shadow-xs'
                  : 'border-base-300 hover:border-base-content/20 text-base-content/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  form.movementType === '202' ? 'bg-error text-error-content' : 'bg-base-200'
                }`}
              >
                <ArrowUpRight size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Egreso</div>
                <div className="text-xs opacity-75">Salida de dinero</div>
              </div>
            </button>
          </div>
          {!form.movementType && shakeKey > 0 && (
            <p className="text-error text-xs mt-1">Por favor selecciona el tipo de movimiento</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <ComerziaSelect
            label="Método de Pago"
            options={options[DICTIONARIES.PAYMENT_TYPE] || []}
            value={form.paymentType}
            onChange={e => setForm({ ...form, paymentType: e.target.value })}
            isLoading={isLoadingDicts}
            enableDefaultOption
            isRequired
            shakeKey={shakeKey}
            error={!form.paymentType && shakeKey > 0 ? 'Requerido' : ''}
          />

          <ComerziaInput
            label={`Monto (${currency})`}
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            isRequired
            shakeKey={shakeKey}
            error={!form.amount && shakeKey > 0 ? 'Requerido' : ''}
          />
        </div>

        <ComerziaTextarea
          label="Motivo u Observación"
          value={form.observation}
          onChange={e => setForm({ ...form, observation: e.target.value })}
        />
      </div>
    </ComerziaModal>
  );
};
