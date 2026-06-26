import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { posService } from '../services/posService';
import { useToast } from '../../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OpenShiftModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];
  const isOwner = roles.includes('OWNER');
  const isManager = roles.includes('BRANCH_MANAGER');
  const canAssignCashier = isOwner || isManager;
  const { error: toastError, success: toastSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState({
    cashRegisterId: '',
    initialAmount: '',
    cashierEmployeeId: '',
    observation: ''
  });

  const [registers, setRegisters] = useState<{value: string, label: string}[]>([]);
  const [cashiers, setCashiers] = useState<{value: string, label: string}[]>([]);
  const [loadingExternals, setLoadingExternals] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        cashRegisterId: '',
        initialAmount: '',
        cashierEmployeeId: '',
        observation: ''
      });
      loadExternalData();
    }
  }, [isOpen]);

  const loadExternalData = async () => {
    setLoadingExternals(true);
    try {
      const regRes = await posService.getAvailableCashRegisters();
      setRegisters(regRes.map(r => ({ value: r.id, label: r.name })));

      if (canAssignCashier) {
        try {
          const cashRes = await posService.getCashiers();
          setCashiers(cashRes.map(c => ({ value: c.id, label: c.fullName })));
        } catch (err: any) {
          if (err.response?.status === 403) {
            // Fallback for OWNER if backend restricts getCashiers due to lack of branchId
            const { employeeService } = await import('../../employees/services/employeeService');
            const allEmp = await employeeService.getAll(0, 100);
            // Filtrar los que tienen rol CASHIER o Cajero (opcional, o mostrar todos)
            const cashiersOnly = allEmp.content.filter(e => e.roleNames?.some(r => r.toUpperCase().includes('CASHIER') || r.toUpperCase().includes('CAJERO')));
            setCashiers((cashiersOnly.length > 0 ? cashiersOnly : allEmp.content).map(c => ({ value: c.id, label: c.fullName })));
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      toastError("Error al cargar datos externos.");
    } finally {
      setLoadingExternals(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.cashRegisterId || !form.initialAmount || (canAssignCashier && !form.cashierEmployeeId)) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      await posService.openShift({
        cashRegisterId: form.cashRegisterId,
        initialAmount: Number(form.initialAmount),
        cashierEmployeeId: canAssignCashier ? form.cashierEmployeeId : undefined,
        observation: form.observation || undefined
      });
      toastSuccess("Turno abierto exitosamente.");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "";
      if (msg.includes("already has an active shift")) {
        toastError("Este cajero ya tiene un turno abierto.");
      } else if (msg.includes("already has an open shift") || msg.includes("already an active")) {
        toastError("Esta caja registradora ya tiene un turno abierto.");
      } else {
        toastError("Error al abrir el turno. Verifica los datos.");
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
      title="Aperturar Turno"
      size="md"
      actions={
        <div className="flex justify-end gap-2 w-full mt-4">
          <BtnCancel onClick={onClose} disabled={isLoading} />
          <BtnSave onClick={handleSubmit} isLoading={isLoading} />
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <ComerziaSelect
          label="Caja Registradora"
          options={registers}
          value={form.cashRegisterId}
          onChange={e => setForm({...form, cashRegisterId: e.target.value})}
          isLoading={loadingExternals}
          enableDefaultOption
          isRequired
          shakeKey={shakeKey}
          error={!form.cashRegisterId && shakeKey > 0 ? "Requerido" : ""}
        />

        {canAssignCashier && (
          <ComerziaSelect
            label="Asignar Cajero"
            options={cashiers}
            value={form.cashierEmployeeId}
            onChange={e => setForm({...form, cashierEmployeeId: e.target.value})}
            isLoading={loadingExternals}
            enableDefaultOption
            isRequired
            shakeKey={shakeKey}
            error={!form.cashierEmployeeId && shakeKey > 0 ? "Requerido" : ""}
          />
        )}

        <ComerziaInput
          label="Monto Inicial (Base)"
          type="number"
          value={form.initialAmount}
          onChange={e => setForm({...form, initialAmount: e.target.value})}
          isRequired
          shakeKey={shakeKey}
          error={!form.initialAmount && shakeKey > 0 ? "Requerido" : ""}
        />

        <ComerziaInput
          label="Observaciones (Opcional)"
          value={form.observation}
          onChange={e => setForm({...form, observation: e.target.value})}
        />
      </div>
    </ComerziaModal>
  );
};
