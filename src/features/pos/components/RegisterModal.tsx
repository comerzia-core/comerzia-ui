import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import { branchService } from '../../organization/services/branchService';
import { useToast } from '../../../context/ToastContext';
import type { CashRegisterResponse } from '../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registerToEdit?: CashRegisterResponse | null;
}

export const RegisterModal = ({ isOpen, onClose, onSuccess, registerToEdit }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState({
    name: '',
    branchId: '',
    status: true
  });

  const [branches, setBranches] = useState<{value: string, label: string}[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (registerToEdit) {
        setForm({
          name: registerToEdit.name,
          branchId: registerToEdit.branchId, // Just for UI completeness, API won't update it
          status: registerToEdit.status
        });
      } else {
        setForm({
          name: '',
          branchId: '',
          status: true
        });
      }
      loadBranches();
    }
  }, [isOpen, registerToEdit]);

  const loadBranches = async () => {
    setIsLoadingBranches(true);
    try {
      const data = await branchService.getBranches(0, 100);
      setBranches(data.content.map(b => ({ value: b.id, label: b.name })));
    } catch {
      toastError("Error al cargar sucursales");
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || (!registerToEdit && !form.branchId)) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      if (registerToEdit) {
        await posService.updateCashRegister(registerToEdit.id, {
          name: form.name,
          status: form.status
        });
        toastSuccess("Caja actualizada.");
      } else {
        await posService.createCashRegister({
          branchId: form.branchId,
          name: form.name,
          status: form.status
        });
        toastSuccess("Caja creada.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error;
      if (status === 409) {
        toastError("Ya existe una caja con ese nombre en la sucursal.");
      } else if (apiMsg) {
        toastError(apiMsg);
      } else {
        toastError("No se pudo guardar la caja.");
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
      title={registerToEdit ? "Editar Caja Registradora" : "Nueva Caja Registradora"}
      size="md"
      actions={
        <div className="flex flex-row items-center gap-2 w-full sm:justify-end mt-4">
          <BtnCancel onClick={onClose} disabled={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          <BtnSave onClick={handleSubmit} isLoading={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <ComerziaInput
          label="Nombre de la Caja"
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          isRequired
          shakeKey={shakeKey}
          error={!form.name && shakeKey > 0 ? "Requerido" : ""}
          placeholder="Ej: Caja Principal 01"
        />

        <ComerziaSelect
          label="Sucursal"
          options={branches}
          value={form.branchId}
          onChange={e => setForm({...form, branchId: e.target.value})}
          isLoading={isLoadingBranches}
          enableDefaultOption
          isRequired={!registerToEdit}
          disabled={!!registerToEdit} // Cannot change branch after creation
          shakeKey={shakeKey}
          error={!form.branchId && !registerToEdit && shakeKey > 0 ? "Requerido" : ""}
        />

        <div className="pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-base-content/80">Estado Operativo</span>
            <ComerziaSwitch
              checked={form.status}
              onChange={() => setForm({...form, status: !form.status})}
              disabled={registerToEdit?.hasActiveShift}
            />
          </div>
          {registerToEdit?.hasActiveShift && (
            <p className="text-xs text-warning mt-1">
              No puedes desactivar esta caja porque tiene un turno abierto.
            </p>
          )}
        </div>
      </div>
    </ComerziaModal>
  );
};
