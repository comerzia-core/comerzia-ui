// src/features/employees/components/InviteEmployeeModal.tsx
import React, { useState, useEffect } from 'react';
import { Mail, Shield, Building2 } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnSave, BtnCancel } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { invitationService } from '../services/invitationService';
import { userService } from '../../security/services/userService';
import { branchService } from '../../organization/services/branchService';
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

  const [email, setEmail] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
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
    setSelectedRoleCode('');
    setSelectedBranchId('');
    setErrorMessage(null);
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
        const delegable = (allRoles || []).filter(
          r => !['ROOT', 'OWNER'].includes(r.name.toUpperCase()) && !r.name.toUpperCase().startsWith('SAAS_')
        );
        setRoles(delegable);
        setBranches(allBranches || []);
      })
      .finally(() => {
        if (active) setRolesLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [isOpen, rolesLoaded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (!selectedRoleCode) {
      setErrorMessage('Debes seleccionar un rol para el colaborador.');
      return;
    }

    const roleCodeNum = parseInt(selectedRoleCode, 10);
    if (isNaN(roleCodeNum)) {
      setErrorMessage('Rol seleccionado inválido.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await invitationService.createInvitation({
        email: cleanEmail,
        roleCode: roleCodeNum,
        branchId: selectedBranchId || null,
        requestKey
      });

      success(`Invitación enviada exitosamente a ${cleanEmail}`);
      onInvitationCreated();
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      const code = axiosErr.response?.data?.code;
      const apiMsg = axiosErr.response?.data?.message;

      let userMsg = 'No se pudo enviar la invitación. Inténtalo de nuevo.';
      if (code === 'invitation_capacity_unavailable') {
        userMsg = 'No cuentas con cupos de usuarios disponibles en tu suscripción.';
      } else if (code === 'invitation_conflict') {
        userMsg = 'Ya existe un usuario o una invitación pendiente para este correo.';
      } else if (code === 'invitation_role_not_delegable') {
        userMsg = 'No tienes permisos suficientes para delegar este rol.';
      } else if (code === 'invitation_rate_limited') {
        userMsg = 'Has alcanzado el límite de invitaciones permitidas por ahora.';
      } else if (code === 'invitation_unavailable') {
        userMsg = 'El sistema de invitaciones se encuentra temporalmente en mantenimiento.';
      } else if (apiMsg) {
        userMsg = apiMsg;
      }

      setErrorMessage(userMsg);
      toastError(userMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = roles.map(r => ({
    value: r.id,
    label: r.displayName || r.name
  }));

  const branchOptions = [
    { value: '', label: 'Sin sucursal específica (Global)' },
    ...branches.map(b => ({
      value: b.id,
      label: b.name
    }))
  ];

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
        <>
          <BtnCancel onClick={handleClose} disabled={isSubmitting} />
          <BtnSave
            onClick={() => handleSubmit()}
            label="Enviar Invitación"
            isLoading={isSubmitting}
            disabled={isSubmitting || isLoadingOptions}
          />
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-error/10 text-error rounded-xl text-xs font-medium animate-fade-in">
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
            onChange={e => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            autoFocus
          />
          <p className="text-[11px] text-base-content/50 mt-1">
            El colaborador recibirá un enlace criptográfico seguro para activar su cuenta.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Rol a Asignar <span className="text-error">*</span>
          </label>
          <ComerziaSelect
            placeholder={isLoadingOptions ? 'Cargando roles...' : 'Selecciona un rol'}
            options={roleOptions}
            value={selectedRoleCode}
            onChange={e => setSelectedRoleCode(e.target.value)}
            disabled={isSubmitting || isLoadingOptions}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Sucursal Asignada (Opcional)
          </label>
          <ComerziaSelect
            placeholder="Selecciona una sucursal"
            options={branchOptions}
            value={selectedBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}
            disabled={isSubmitting || isLoadingOptions}
          />
          <p className="text-[11px] text-base-content/50 mt-1">
            Limita el ámbito de operación del colaborador a una sucursal específica.
          </p>
        </div>
      </form>
    </ComerziaModal>
  );
};

