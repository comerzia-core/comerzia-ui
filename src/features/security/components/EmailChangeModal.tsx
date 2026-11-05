import React from 'react';
import { Mail, KeyRound, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { useEmailChangeRequest } from '../hooks/useEmailChangeRequest';

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string | null;
  onSuccess: (message: string) => void;
}

export const EmailChangeModal: React.FC<EmailChangeModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <EmailChangeModalContent {...props} />;
};

const EmailChangeModalContent: React.FC<EmailChangeModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSuccess,
}) => {
  const { newEmail, setNewEmail, currentPassword, setCurrentPassword, showPassword, setShowPassword, errorMessage, isSubmitting, shakeKey, handleSubmit } = useEmailChangeRequest({ currentEmail, onSuccess, onClose });
  const revealAction = (
    <button
      type="button"
      className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-primary" />
          <span>Cambiar Correo de Acceso</span>
        </div>
      }
      size="sm"
      actions={
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            className="btn btn-ghost btn-sm rounded-xl"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary btn-sm rounded-xl"
            disabled={isSubmitting || !newEmail || !currentPassword}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Enviando...
              </>
            ) : (
              'Solicitar cambio'
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <p className="text-xs text-base-content/70">
          Por seguridad, debes reautenticarte con tu contraseña actual. Se enviará un enlace de confirmación al nuevo correo.
        </p>

        {currentEmail && (
          <div className="text-xs bg-base-200/50 p-2.5 rounded-xl border border-base-200">
            <span className="font-semibold text-base-content/80">Correo actual: </span>
            <span className="font-mono text-base-content">{currentEmail}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error text-xs p-3 rounded-xl flex items-start gap-2" role="alert">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <ComerziaInput
          id="email-change-new-email"
          name="newEmail"
          label="Nuevo correo electrónico"
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          shakeKey={shakeKey}
          isRequired
          disabled={isSubmitting}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          icon={<Mail size={16} className="text-base-content/40" />}
        />

        <ComerziaInput
          id="email-change-current-password"
          name="currentPassword"
          label="Contraseña actual"
          type={showPassword ? 'text' : 'password'}
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          shakeKey={shakeKey}
          isRequired
          disabled={isSubmitting}
          autoComplete="current-password"
          icon={<KeyRound size={16} className="text-base-content/40" />}
          rightAction={revealAction}
        />

        <div className="text-[11px] text-base-content/60 bg-base-200/30 p-2.5 rounded-xl border border-base-200 flex items-start gap-2">
          <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
          <span>
            Al confirmar el nuevo correo, se cerrarán todas las sesiones activas en tus dispositivos para proteger tu cuenta.
          </span>
        </div>
      </form>
    </ComerziaModal>
  );
};
