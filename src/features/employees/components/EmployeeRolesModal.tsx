// src/features/employees/components/EmployeeRolesModal.tsx
import { useState, useEffect } from 'react';
import { UserCog, Loader2 } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaSelectableCard } from '../../../components/ui/ComerziaSelectableCard';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { EmployeeDemotionBranchModal } from './EmployeeDemotionBranchModal';
import { employeeService } from '../services/employeeService';
import { userService } from '../../security/services/userService';
import { useToast } from '../../../context/ToastContext';
import type { EmployeeSummaryResponse } from '../types/employee';
import type { RoleResponse } from '../../security/types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeSummaryResponse | null;
  onSuccess: () => void;
}

export const EmployeeRolesModal = ({ isOpen, onClose, employee, onSuccess }: Props) => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  // Modal para seleccionar sucursal cuando se retira el rol OWNER
  const [isDemotionModalOpen, setIsDemotionModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && employee) {
      loadRoles();
    }
  }, [isOpen, employee]);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const allRoles = await userService.getAllRoles();
      setRoles(allRoles);

      // Preseleccionar IDs de roles indexando con employee.roleIds y opcionalmente roleNames
      const currentRoleIds = employee?.roleIds ? Array.from(employee.roleIds) : [];
      const currentRoleNames = employee?.roleNames ? Array.from(employee.roleNames) : [];

      const initialSelectedIds = allRoles
        .filter(r => currentRoleIds.includes(r.id) || currentRoleNames.includes(r.displayName) || currentRoleNames.includes(r.name))
        .map(r => r.id);

      setSelectedRoleIds(initialSelectedIds);
    } catch (error) {
      console.error('Error loading system roles:', error);
      showErrorToast('Error al cargar la lista de roles del sistema');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    if (!employee) return;

    if (selectedRoleIds.length === 0) {
      setShakeKey(prev => prev + 1);
      showErrorToast('Debe seleccionar al menos un rol para el personal');
      return;
    }

    try {
      setIsSaving(true);
      await employeeService.updateRoles(employee.id, selectedRoleIds);
      showSuccessToast('Roles del personal actualizados exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating employee roles:', error);

      // Capturamos si el backend requiere asignación de sucursal por degradación de OWNER
      const backendMessage = error?.response?.data?.message;
      if (backendMessage === 'BRANCH_REQUIRED_FOR_DEMOTION') {
        setIsDemotionModalOpen(true);
        return;
      }

      const msg = error?.response?.data?.message || 'Error al actualizar los roles del personal';
      showErrorToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const modalActions = (
    <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
      <BtnCancel onClick={onClose} disabled={isSaving} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
      <BtnSave onClick={handleSave} isLoading={isSaving} label="Guardar Roles" responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
    </div>
  );

  return (
    <>
      <ComerziaModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2 text-primary font-bold">
            <UserCog size={22} />
            Modificar Roles de {employee?.fullName}
          </div>
        }
        actions={modalActions}
        size="lg"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-base-content/70">
            Seleccione los roles del sistema que tendrá asignados el personal{' '}
            <strong className="text-base-content">{employee?.fullName}</strong>:
          </p>

          {isLoadingRoles ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs text-base-content/60">Cargando catálogo de roles...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[430px] overflow-y-auto pr-1 p-1">
              {roles.map(role => (
                <ComerziaSelectableCard
                  key={role.id}
                  title={role.displayName || role.name}
                  description={role.description}
                  selected={selectedRoleIds.includes(role.id)}
                  onClick={() => toggleRole(role.id)}
                  className="!p-3.5"
                />
              ))}
            </div>
          )}

          {selectedRoleIds.length === 0 && shakeKey > 0 && (
            <span className="text-xs font-semibold text-error block animate-shake">
              * Debe asignar al menos un rol al personal.
            </span>
          )}
        </div>
      </ComerziaModal>

      {/* MODAL DE ASIGNACIÓN DE SUCURSAL CUANDO SE RETIRA EL ROL OWNER */}
      <EmployeeDemotionBranchModal
        isOpen={isDemotionModalOpen}
        onClose={() => setIsDemotionModalOpen(false)}
        employee={employee}
        roleIds={selectedRoleIds}
        onSuccess={() => {
          setIsDemotionModalOpen(false);
          onSuccess();
          onClose();
        }}
      />
    </>
  );
};
