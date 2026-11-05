// src/features/employees/components/RevokeInvitationModal.tsx
import React, { useState } from 'react';
import { AlertTriangle, UserX } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { invitationService } from '../services/invitationService';
import type { TenantEmployeeInvitationResponse } from '../types/invitation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRevoked: () => void;
  invitation: TenantEmployeeInvitationResponse | null;
}

export const RevokeInvitationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRevoked,
  invitation
}) => {
  const { success, error: toastError } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setReason('');
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!invitation) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const cleanReason = reason.trim();
    if (!cleanReason) {
      setErrorMessage('Debes indicar un motivo para la revocación.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await invitationService.revokeInvitation(invitation.publicReference, cleanReason);
      success(`Invitación para "${invitation.email}" revocada exitosamente.`);
      onRevoked();
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      const apiMsg = axiosErr.response?.data?.message;
      const userMsg = apiMsg || 'No se pudo revocar la invitación. Inténtalo de nuevo.';
      setErrorMessage(userMsg);
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
          <UserX className="w-5 h-5 text-error" />
          <span>Revocar Invitación</span>
        </div>
      }
      actions={
        <>
          <BtnCancel onClick={handleClose} disabled={isSubmitting} />
          <button
            type="button"
            className="btn btn-error btn-sm text-white"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? 'Revocando...' : 'Revocar Invitación'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-error/10 text-error rounded-xl text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <div className="p-3 bg-warning/10 text-warning-content rounded-xl border border-warning/20 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-warning mt-0.5" />
          <div>
            Estás a punto de revocar la invitación dirigida a{' '}
            <strong className="font-semibold text-base-content">{invitation.email}</strong> para el rol{' '}
            <strong className="font-semibold text-base-content">{invitation.roleName}</strong>.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Motivo de la revocación <span className="text-error">*</span>
          </label>
          <ComerziaInput
            placeholder="Ej: Error en correo de destino, vacante cerrada..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            disabled={isSubmitting}
            required
            autoFocus
          />
        </div>
      </form>
    </ComerziaModal>
  );
};

