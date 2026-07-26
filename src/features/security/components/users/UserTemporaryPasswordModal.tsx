// src/features/security/components/users/UserTemporaryPasswordModal.tsx
import { useState } from 'react';
import { Key, Copy, Check, ShieldAlert } from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { BtnCancel } from '../../../../components/ui/CrudButtons';
import { useToast } from '../../../../context/ToastContext';
import type { ResetPasswordResponse } from '../../types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  credentials: ResetPasswordResponse | null;
}

export const UserTemporaryPasswordModal = ({ isOpen, onClose, credentials }: Props) => {
  const { addToast: showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!credentials) return null;

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(credentials.temporaryPassword);
    setCopied(true);
    showToast('Contraseña temporal copiada al portapapeles', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const modalActions = (
    <div className="flex justify-end gap-2 w-full">
      <BtnCancel onClick={onClose} label="Cerrar" />
    </div>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary font-bold">
          <Key size={22} />
          Contraseña Temporal Generada
        </div>
      }
      actions={modalActions}
      size="md"
    >
      <div className="space-y-5 pt-2">
        <div className="alert bg-warning/10 border border-warning/30 text-base-content rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-warning-content">¡Atención Administrador!</p>
            <p className="text-base-content/80 leading-relaxed">
              La contraseña actual ha sido restablecida. Proporcione la siguiente contraseña temporal al usuario. El sistema le solicitará cambiarla obligatoriamente en su próximo inicio de sesión.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-base-200/60 p-4 rounded-2xl border border-base-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-base-content/60">Usuario:</span>
            <span className="font-mono text-sm font-bold text-base-content">
              @{credentials.username}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-base-content/60">Contraseña Temporal:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black tracking-wider text-primary bg-base-100 px-3 py-1.5 rounded-xl border border-primary/20 shadow-xs">
                {credentials.temporaryPassword}
              </span>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="btn btn-sm btn-primary gap-1 rounded-xl shadow-xs"
                title="Copiar contraseña"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ComerziaModal>
  );
};
