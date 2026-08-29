// src/features/security/components/users/UserTemporaryPasswordModal.tsx
import { useState } from 'react';
import { Key, Copy, CheckCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../../components/ui/ComerziaButton';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import type { ResetPasswordResponse } from '../../types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  credentials: ResetPasswordResponse | null;
}

export const UserTemporaryPasswordModal = ({ isOpen, onClose, credentials }: Props) => {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!credentials) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentials.temporaryPassword || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallo al copiar la contraseña al portapapeles', err);
    }
  };

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
      size="md"
    >
      <div className="flex flex-col gap-4 text-center items-center py-2">
        <p className="text-sm text-base-content/70 bg-warning/10 p-3 rounded-xl border border-warning/20 text-left w-full">
          <ShieldAlert size={18} className="inline mr-2 text-warning -mt-0.5" />
          <strong>¡Atención Administrador!</strong> La contraseña del usuario ha sido restablecida. Esta contraseña temporal se muestra por <strong>única vez</strong>. El sistema obligará al usuario a cambiarla en su próximo inicio de sesión.
        </p>

        <div className="w-full text-left bg-base-200/60 p-4 rounded-xl space-y-3 border border-base-200">
          <ComerziaInput
            label="Usuario"
            value={credentials.username}
            readOnly
            disabled
          />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold">Contraseña Temporal</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.temporaryPassword}
                  readOnly
                  disabled
                  className="input input-bordered w-full bg-base-100 font-mono tracking-widest text-base pr-10 text-base-content"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <ComerziaButton
                type="button"
                variant={copied ? 'success' : 'neutral'}
                onClick={handleCopy}
                icon={copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                label={copied ? 'Copiado' : 'Copiar'}
                className="min-w-[110px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end w-full">
        <ComerziaButton
          variant="primary"
          label="Entendido, cerrar"
          onClick={onClose}
          responsive={true}
          className="w-full sm:w-auto"
        />
      </div>
    </ComerziaModal>
  );
};
