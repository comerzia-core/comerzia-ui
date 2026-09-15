// src/features/employees/components/EmployeeDemotionBranchModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaSelectableCard } from '../../../components/ui/ComerziaSelectableCard';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { branchService } from '../../organization/services/branchService';
import { employeeService } from '../services/employeeService';
import { useToast } from '../../../context/ToastContext';
import type { EmployeeSummaryResponse } from '../types/employee';
import type { BranchResponse } from '../../organization/types/branch';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeSummaryResponse | null;
  roleIds: string[];
  onSuccess: () => void;
}

export const EmployeeDemotionBranchModal = ({
  isOpen,
  onClose,
  employee,
  roleIds,
  onSuccess
}: Props) => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedBranchId(null);
      setSearchQuery('');
      setShakeKey(0);
      loadBranches();
    }
  }, [isOpen]);

  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      // Obtenemos las sucursales activas de la empresa
      const res = await branchService.getBranches(0, 50, true);
      setBranches(res.content || []);
    } catch (error) {
      console.error('Error loading tenant branches for employee demotion:', error);
      showErrorToast('Error al cargar la lista de sucursales disponibles');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches;
    const query = searchQuery.toLowerCase();
    return branches.filter(
      b =>
        b.name.toLowerCase().includes(query) ||
        (b.code && b.code.toLowerCase().includes(query)) ||
        (b.address && b.address.toLowerCase().includes(query))
    );
  }, [branches, searchQuery]);

  const handleConfirm = async () => {
    if (!employee) return;

    if (!selectedBranchId) {
      setShakeKey(prev => prev + 1);
      showErrorToast('Debe seleccionar una sucursal para continuar');
      return;
    }

    try {
      setIsSubmitting(true);
      await employeeService.updateRoles(employee.id, roleIds, selectedBranchId);
      showSuccessToast('Roles y sucursal asignados exitosamente al personal');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating employee roles with branch assignment:', error);
      const msg = error?.response?.data?.message || 'Error al asignar la sucursal y actualizar los roles';
      showErrorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalActions = (
    <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
      <BtnCancel
        onClick={onClose}
        disabled={isSubmitting}
        responsive={true}
        className="flex-1 sm:flex-none sm:w-auto min-w-0"
      />
      <BtnSave
        onClick={handleConfirm}
        isLoading={isSubmitting}
        label="Asignar Sucursal"
        responsive={true}
        className="flex-1 sm:flex-none sm:w-auto min-w-0"
      />
    </div>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary font-bold">
          <Store size={22} />
          Asignar Sucursal a {employee?.fullName}
        </div>
      }
      actions={modalActions}
      size="lg"
    >
      <div className="space-y-4 pt-2">
        <p className="text-xs text-base-content/70">
          Al remover el rol de Propietario (Owner), el empleado{' '}
          <strong className="text-base-content">{employee?.fullName}</strong> debe tener una sucursal asignada.
          Seleccione la sucursal o tienda a la que pertenecerá:
        </p>

        {branches.length > 4 && (
          <div className="w-full">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar sucursal por nombre, código o dirección..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {isLoadingBranches ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-base-content/60">Cargando sucursales disponibles...</span>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron sucursales disponibles.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[430px] overflow-y-auto pr-1 p-1">
            {filteredBranches.map(branch => (
              <ComerziaSelectableCard
                key={branch.id}
                icon={<Store size={20} />}
                title={branch.name}
                description={
                  branch.address
                    ? `${branch.code ? `[${branch.code}] ` : ''}${branch.address}`
                    : branch.code
                    ? `Código: ${branch.code}`
                    : undefined
                }
                selected={selectedBranchId === branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className="!p-3.5"
              />
            ))}
          </div>
        )}

        {!selectedBranchId && shakeKey > 0 && (
          <span className="text-xs font-semibold text-error block animate-shake">
            * Debe seleccionar una sucursal para continuar.
          </span>
        )}
      </div>
    </ComerziaModal>
  );
};
