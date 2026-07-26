// src/features/security/components/users/UserRolesModal.tsx
import { useState, useEffect } from 'react';
import { UserCog, Loader2 } from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaSelectableCard } from '../../../../components/ui/ComerziaSelectableCard';
import { BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { userService } from '../../services/userService';
import { useToast } from '../../../../context/ToastContext';
import type { UserResponse, RoleResponse } from '../../types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserResponse | null;
  onSuccess: () => void;
}

export const UserRolesModal = ({ isOpen, onClose, user, onSuccess }: Props) => {
  const { addToast: showToast } = useToast();

  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  useEffect(() => {
    if (isOpen && user) {
      loadRoles();
    }
  }, [isOpen, user]);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const allRoles = await userService.getAllRoles();
      setRoles(allRoles);

      // Preseleccionar IDs de roles que coinciden por nombre o id
      const initialSelectedIds = allRoles
        .filter(r => user?.roles?.includes(r.name) || user?.roles?.includes(r.id))
        .map(r => r.id);

      setSelectedRoleIds(initialSelectedIds);
    } catch (error) {
      console.error('Error loading system roles:', error);
      showToast('Error al cargar la lista de roles del sistema', 'error');
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
    if (!user) return;

    if (selectedRoleIds.length === 0) {
      setShakeKey(prev => prev + 1);
      showToast('Debe seleccionar al menos un rol para el usuario', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await userService.updateUserRoles(user.id, selectedRoleIds);
      showToast('Roles de usuario actualizados exitosamente', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating user roles:', error);
      showToast('Error al actualizar los roles del usuario', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const modalActions = (
    <>
      <BtnCancel onClick={onClose} disabled={isSaving} />
      <BtnSave onClick={handleSave} isLoading={isSaving} label="Guardar Roles" />
    </>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary font-bold">
          <UserCog size={22} />
          Modificar Roles de @{user?.username}
        </div>
      }
      actions={modalActions}
      size="lg"
    >
      <div className="space-y-4 pt-2">
        <p className="text-xs text-base-content/70">
          Seleccione los roles del sistema que tendrá asignados el usuario{' '}
          <strong className="text-base-content">{user?.fullName}</strong> (@{user?.username}):
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
                title={role.name}
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
            * Debe asignar al menos un rol al usuario.
          </span>
        )}
      </div>
    </ComerziaModal>
  );
};
