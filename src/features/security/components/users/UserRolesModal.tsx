import { isAxiosError } from 'axios';
import { useState, useEffect } from 'react';
import { UserCog, Loader2 } from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaSelectableCard } from '../../../../components/ui/ComerziaSelectableCard';
import { BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { DemotionBranchModal } from './DemotionBranchModal';
import { userService } from '../../services/userService';
import { useToast } from '../../../../context/ToastContext';
import type { UserResponse, RoleResponse } from '../../types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserResponse | null;
  onSuccess: () => void;
}

export const UserRolesModal = (props: Props) => props.isOpen && props.user
  ? <UserRolesModalContent key={props.user.id} {...props} /> : null;

function UserRolesModalContent({ isOpen, onClose, user, onSuccess }: Props) {
  const { addToast: showToast } = useToast();

  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  // Modal para seleccionar sucursal cuando se retira el rol OWNER
  const [isDemotionModalOpen, setIsDemotionModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    userService.getAllRoles().then(allRoles => {
      if (!active) return;
      setRoles(allRoles);
      setSelectedRoleIds(user?.roleIds?.length ? user.roleIds : allRoles
        .filter(role => user?.roles?.includes(role.displayName) || user?.roles?.includes(role.name) || user?.roles?.includes(role.id))
        .map(role => role.id));
    }).catch(error => {
      if (active) { console.error('Error loading system roles:', error); showToast('No se pudieron cargar los roles.', 'error'); }
    }).finally(() => { if (active) setIsLoadingRoles(false); });
    return () => { active = false; };
  }, [user, showToast]);

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
      setShakeKey(0);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating user roles:', error);

      // Capturamos si el backend requiere asignación de sucursal por degradación de OWNER
      const backendMessage = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      if (backendMessage === 'BRANCH_REQUIRED_FOR_DEMOTION') {
        setIsDemotionModalOpen(true);
        return;
      }

      showToast('Error al actualizar los roles del usuario', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setShakeKey(0);
    onClose();
  };

  const modalActions = (
    <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
      <BtnCancel onClick={handleModalClose} disabled={isSaving} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
      <BtnSave onClick={handleSave} isLoading={isSaving} label="Guardar Roles" responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
    </div>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={handleModalClose}
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
            * Debe asignar al menos un rol al usuario.
          </span>
        )}
      </div>

      {/* MODAL DE ASIGNACIÓN DE SUCURSAL CUANDO SE RETIRA EL ROL OWNER */}
      <DemotionBranchModal
        isOpen={isDemotionModalOpen}
        onClose={() => setIsDemotionModalOpen(false)}
        user={user}
        roleIds={selectedRoleIds}
        onSuccess={() => {
          setIsDemotionModalOpen(false);
          onSuccess();
          onClose();
        }}
      />
    </ComerziaModal>
  );
}
