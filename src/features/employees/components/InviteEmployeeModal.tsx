// src/features/employees/components/InviteEmployeeModal.tsx
import React, { useState, useEffect } from 'react';
import { Mail, Shield, Store, Loader2 } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelectableCard } from '../../../components/ui/ComerziaSelectableCard';
import { BtnSave, BtnCancel } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../context/ToastContext';
import { invitationService } from '../services/invitationService';
import { userService } from '../../security/services/userService';
import { branchService } from '../../organization/services/branchService';
import { invitationErrorMessage, isVisibleInvitationRole } from '../utils/invitationFlow';
import type { RoleResponse } from '../../security/types/user';
import type { TenantActiveBranchResponse } from '../../organization/types/branch';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInvitationCreated: () => void;
}

export const InviteEmployeeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onInvitationCreated
}) => {
  const { success, error: toastError } = useToast();
  const canInviteOwner = useAuthStore(state => state.hasRole('OWNER'));

  const [email, setEmail] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [shakeKey, setShakeKey] = useState(0);
  const [requestKey, setRequestKey] = useState<string>(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now()
  );

  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [branches, setBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoadingOptions = isOpen && !rolesLoaded;

  const resetForm = () => {
    setEmail('');
    setSelectedRoleIds([]);
    setSelectedBranchId('');
    setErrorMessage(null);
    setShakeKey(0);
    setIsSubmitting(false);
    setRequestKey(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Cargar diccionarios cuando se abre el modal
  useEffect(() => {
    if (!isOpen || rolesLoaded) return;
    let active = true;
    Promise.all([
      userService.getAllRoles().catch(() => []),
      branchService.getActiveBranches().catch(() => [])
    ])
      .then(([allRoles, allBranches]) => {
        if (!active) return;
        const delegable = (allRoles || []).filter(role => isVisibleInvitationRole(role, canInviteOwner));
        setRoles(delegable);
        setBranches(allBranches || []);
      })
      .finally(() => {
        if (active) setRolesLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [isOpen, rolesLoaded, canInviteOwner]);

  // Si se selecciona el rol OWNER
  const isOwnerSelected = selectedRoleIds.some(id => {
    const r = roles.find(role => role.id === id);
    if (!r) return false;
    return r.name.toUpperCase() === 'OWNER';
  });

  // Dinámica de asignación de sucursal:
  // Si no es owner y hay roles seleccionados, selecciona la primera por defecto si no hay ninguna elegida
  const toggleRole = (roleId: string) => {
    const nextIds = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter(id => id !== roleId) : [...selectedRoleIds, roleId];
    setSelectedRoleIds(nextIds);
    const ownerSelected = nextIds.some(id => roles.find(role => role.id === id)?.name.toUpperCase() === 'OWNER');
    setSelectedBranchId(ownerSelected || nextIds.length === 0 ? '' : selectedBranchId || branches[0]?.id || '');
    setErrorMessage(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      setShakeKey(k => k + 1);
      return;
    }

    if (selectedRoleIds.length === 0) {
      setErrorMessage('Debes seleccionar al menos un rol para el colaborador.');
      setShakeKey(k => k + 1);
      return;
    }

    if (!isOwnerSelected && !selectedBranchId) {
      setErrorMessage('Debes seleccionar una sucursal para el colaborador.');
      setShakeKey(k => k + 1);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await invitationService.createInvitation({
        email: cleanEmail,
        roleIds: selectedRoleIds,
        branchId: isOwnerSelected ? null : selectedBranchId,
        requestKey
      });

      success(`Invitación enviada exitosamente a ${cleanEmail}`);
      onInvitationCreated();
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      const code = axiosErr.response?.data?.code;
      const userMsg = invitationErrorMessage(code);

      setErrorMessage(userMsg);
      setShakeKey(k => k + 1);
      toastError(userMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : handleClose}
      title={
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <span>Invitar Colaborador</span>
        </div>
      }
      actions={
        <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
          <BtnCancel onClick={handleClose} disabled={isSubmitting} />
          <BtnSave
            onClick={() => handleSubmit()}
            label="Enviar Invitación"
            isLoading={isSubmitting}
            disabled={isSubmitting || isLoadingOptions}
          />
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className={`p-3 bg-error/10 text-error rounded-xl text-xs font-medium ${shakeKey > 0 ? 'animate-shake' : 'animate-fade-in'}`}>
            {errorMessage}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Correo Electrónico del Colaborador <span className="text-error">*</span>
          </label>
          <ComerziaInput
            icon="Mail"
            type="email"
            placeholder="colaborador@empresa.com"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setErrorMessage(null);
            }}
            disabled={isSubmitting}
            required
            autoFocus
          />
          <p className="text-[11px] text-base-content/50 mt-1">
            El colaborador recibirá un enlace seguro para unirse directamente a tu empresa.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Roles a Asignar <span className="text-error">*</span>
          </label>
          <p className="text-[11px] text-base-content/50 mb-2">
            Selecciona uno o más roles para el colaborador (todos deseleccionados por defecto):
          </p>

          {isLoadingOptions ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs text-base-content/60">Cargando catálogo de roles...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 p-1">
              {roles.map(role => (
                <ComerziaSelectableCard
                  key={role.id}
                  title={role.displayName || role.name}
                  description={role.description}
                  selected={selectedRoleIds.includes(role.id)}
                  onClick={() => toggleRole(role.id)}
                  className="!p-3"
                />
              ))}
            </div>
          )}
        </div>

        {/* Lógica dinámica de tienda */}
        {selectedRoleIds.length > 0 && isOwnerSelected && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex items-start gap-2">
            <Store className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong className="font-semibold">Ámbito Corporativo Global:</strong>
              <p className="text-[11px] opacity-80 mt-0.5">
                El rol de Dueño opera sobre toda la empresa y no requiere asignación a una sucursal específica.
              </p>
              <p className="text-[11px] opacity-80 mt-1">
                Para invitar a otro dueño necesitas activar 2FA en Perfil → Seguridad y confirmar la operación con tu app autenticadora.
              </p>
            </div>
          </div>
        )}

        {selectedRoleIds.length > 0 && !isOwnerSelected && (
          <div>
            <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-primary" />
              Sucursal / Tienda Asignada <span className="text-error">*</span>
            </label>
            <p className="text-[11px] text-base-content/50 mb-2">
              Selecciona la sucursal donde el colaborador cumplirá sus funciones:
            </p>

            {branches.length === 0 ? (
              <div className="text-center py-4 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
                No hay sucursales activas registradas en la empresa.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto pr-1 p-1">
                {branches.map(branch => (
                  <ComerziaSelectableCard
                    key={branch.id}
                    icon={<Store size={18} />}
                    title={branch.name}
                    selected={selectedBranchId === branch.id}
                    onClick={() => {
                      setSelectedBranchId(branch.id);
                      setErrorMessage(null);
                    }}
                    className="!p-3"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </ComerziaModal>
  );
};
