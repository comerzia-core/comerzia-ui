// src/features/pos/components/OpenShiftModal.tsx
import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { posService } from '../services/posService';
import { branchService } from '../../organization/services/branchService';
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
    branchId: '',
    cashRegisterId: '',
    initialAmount: '',
    cashierEmployeeId: '',
    observation: ''
  });

  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [registers, setRegisters] = useState<{ value: string; label: string }[]>([]);
  const [cashiers, setCashiers] = useState<{ value: string; label: string }[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingRegisters, setLoadingRegisters] = useState(false);
  const [loadingCashiers, setLoadingCashiers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        branchId: '',
        cashRegisterId: '',
        initialAmount: '',
        cashierEmployeeId: '',
        observation: ''
      });
      setRegisters([]);
      setCashiers([]);

      if (isOwner) {
        loadBranches();
      } else {
        loadNonOwnerData();
      }
    }
  }, [isOpen]);

  // Carga de sucursales activas (solo para OWNER)
  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const data = await branchService.getBranches(0, 100, true);
      const list = data.content || [];
      setBranches(list.map(b => ({ value: b.id, label: b.name })));
    } catch (err) {
      console.error('Error loading active branches:', err);
      toastError('No se pudieron cargar las sucursales.');
    } finally {
      setLoadingBranches(false);
    }
  };

  // Carga inicial para MANAGER / CASHIER
  const loadNonOwnerData = async () => {
    setLoadingRegisters(true);
    try {
      const regPage = await posService.getAllCashRegisters(0, 100, [], true, true);
      setRegisters((regPage.content || []).map(r => ({ value: r.id, label: r.name })));

      if (canAssignCashier) {
        setLoadingCashiers(true);
        try {
          const cashRes = await posService.getCashiers();
          setCashiers(cashRes.map(c => ({ value: c.id, label: c.fullName })));
        } catch (err) {
          console.error('Error loading cashiers:', err);
          toastError('No se pudieron cargar los cajeros.');
        } finally {
          setLoadingCashiers(false);
        }
      }
    } catch (err) {
      console.error('Error loading registers:', err);
      toastError('No se pudieron cargar las cajas disponibles.');
    } finally {
      setLoadingRegisters(false);
    }
  };

  // Manejo de cambio de sucursal (OWNER) -> Carga cajas habilitadas (status=true, availableOnly=true) y cajeros enviando X-Branch-Context
  const handleBranchChange = async (branchId: string) => {
    setForm(prev => ({
      ...prev,
      branchId,
      cashRegisterId: '',
      cashierEmployeeId: ''
    }));
    setRegisters([]);
    setCashiers([]);

    if (!branchId) return;

    setLoadingRegisters(true);
    setLoadingCashiers(true);
    try {
      // 1. Cargar cajas llamando a GET /tenant/cash-registers?status=true&availableOnly=true con header X-Branch-Context
      const regPage = await posService.getAllCashRegisters(0, 100, [], true, true, branchId);
      setRegisters((regPage.content || []).map(r => ({ value: r.id, label: r.name })));

      // 2. Cargar personal cajero enviando GET /tenant/employees/cashiers con header X-Branch-Context
      const cashRes = await posService.getCashiers(branchId);
      setCashiers(cashRes.map(c => ({ value: c.id, label: c.fullName })));
    } catch (err) {
      console.error('Error loading branch registers or cashiers:', err);
      toastError('Error al obtener datos de la sucursal seleccionada.');
    } finally {
      setLoadingRegisters(false);
      setLoadingCashiers(false);
    }
  };

  const handleSubmit = async () => {
    if (
      (isOwner && !form.branchId) ||
      !form.cashRegisterId ||
      !form.initialAmount ||
      (canAssignCashier && !form.cashierEmployeeId)
    ) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      await posService.openShift(
        {
          cashRegisterId: form.cashRegisterId,
          initialAmount: Number(form.initialAmount),
          cashierEmployeeId: canAssignCashier ? form.cashierEmployeeId : undefined,
          observation: form.observation || undefined
        },
        isOwner ? form.branchId : undefined
      );
      toastSuccess('Turno abierto.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error || '';
      if (status === 409 || msg.toLowerCase().includes('open shift') || msg.toLowerCase().includes('active shift')) {
        toastError('La caja o el cajero ya cuenta con un turno abierto.');
      } else if (msg) {
        toastError(msg);
      } else {
        toastError('No se pudo abrir el turno.');
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
        {/* Selector de Sucursal (Solo visible para rol OWNER) */}
        {isOwner && (
          <ComerziaSelect
            label="Sucursal"
            options={branches}
            value={form.branchId}
            onChange={e => handleBranchChange(e.target.value)}
            isLoading={loadingBranches}
            enableDefaultOption
            isRequired
            shakeKey={shakeKey}
            error={!form.branchId && shakeKey > 0 ? 'Requerido' : ''}
          />
        )}

        {/* Selector de Caja Registradora */}
        <ComerziaSelect
          label="Caja Registradora"
          options={registers}
          value={form.cashRegisterId}
          onChange={e => setForm({ ...form, cashRegisterId: e.target.value })}
          isLoading={loadingRegisters}
          enableDefaultOption
          isRequired
          disabled={isOwner && !form.branchId}
          shakeKey={shakeKey}
          error={!form.cashRegisterId && shakeKey > 0 ? 'Requerido' : ''}
        />

        {/* Selector de Asignación de Cajero */}
        {canAssignCashier && (
          <ComerziaSelect
            label="Asignar Cajero"
            options={cashiers}
            value={form.cashierEmployeeId}
            onChange={e => setForm({ ...form, cashierEmployeeId: e.target.value })}
            isLoading={loadingCashiers}
            enableDefaultOption
            isRequired
            disabled={isOwner && (!form.branchId || !form.cashRegisterId)}
            shakeKey={shakeKey}
            error={!form.cashierEmployeeId && shakeKey > 0 ? 'Requerido' : ''}
          />
        )}

        {/* Monto Inicial */}
        <ComerziaInput
          label="Monto Inicial (Base)"
          type="number"
          value={form.initialAmount}
          onChange={e => setForm({ ...form, initialAmount: e.target.value })}
          isRequired
          shakeKey={shakeKey}
          error={!form.initialAmount && shakeKey > 0 ? 'Requerido' : ''}
        />

        {/* Observaciones Opcionales */}
        <ComerziaInput
          label="Observaciones (Opcional)"
          value={form.observation}
          onChange={e => setForm({ ...form, observation: e.target.value })}
        />
      </div>
    </ComerziaModal>
  );
};
