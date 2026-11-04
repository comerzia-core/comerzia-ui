import React, { useState } from 'react';
import { ShieldAlert, KeyRound, AlertTriangle, Loader2 } from 'lucide-react';
import { mfaProfileService } from '../services/mfaProfileService';
import type { MfaStepUpActionType } from '../types/mfa';

interface MfaStepUpModalProps {
  isOpen: boolean;
  action: MfaStepUpActionType;
  title?: string;
  description?: string;
  onSuccess: (grantToken: string) => void;
  onCancel: () => void;
}

const ACTION_DESCRIPTIONS: Record<MfaStepUpActionType, { title: string; desc: string }> = {
  ASSIGN_ROLES: {
    title: 'Confirmar asignación de roles',
    desc: 'Esta acción modifica privilegios de acceso críticos en el sistema y requiere validación de tu segundo factor.'
  },
  UPDATE_USER_ACCESS: {
    title: 'Confirmar modificación de acceso',
    desc: 'Esta operación altera el estado de acceso de una cuenta de usuario y requiere validación de seguridad.'
  },
  MANAGE_SAAS_TEAM: {
    title: 'Confirmar operación en equipo SaaS',
    desc: 'Los cambios en cuentas de plataforma SaaS requieren verificación de segundo factor.'
  },
  DEACTIVATE_MFA: {
    title: 'Confirmar desactivación de 2FA',
    desc: 'Estás a punto de desactivar la autenticación en dos pasos. Ingresa el código actual de tu aplicación para autorizarlo.'
  },
  REGENERATE_RECOVERY_CODES: {
    title: 'Confirmar regeneración de códigos',
    desc: 'Al regenerar nuevos códigos de recuperación se invalidarán todos los anteriores. Ingresa tu código de autenticación.'
  },
  REPLACE_MFA: {
    title: 'Confirmar reemplazo de autenticador',
    desc: 'Para vincular un nuevo dispositivo o aplicación debes verificar primero tu autenticador actual.'
  },
  ADMIN_MFA_RECOVERY: {
    title: 'Confirmar recuperación administrativa de MFA',
    desc: 'Esta operación crítica de recuperación de factores requiere validación estricta de tu segundo factor.'
  }
};

export const MfaStepUpModal: React.FC<MfaStepUpModalProps> = ({
  isOpen,
  action,
  title,
  description,
  onSuccess,
  onCancel
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const config = ACTION_DESCRIPTIONS[action] || {
    title: title || 'Verificación de seguridad',
    desc: description || 'Por favor ingresa tu código de autenticación para continuar.'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      setError('Ingresa el código numérico de 6 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await mfaProfileService.requestStepUp({
        code: cleanCode,
        action
      });
      setCode('');
      onSuccess(response.grantToken);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      const errCode = axiosErr.response?.data?.code;

      if (errCode === 'totp_code_replayed') {
        setError('Este código ya fue utilizado recientemente. Espera a que la app genere el siguiente.');
      } else if (errCode === 'invalid_totp_code') {
        setError('El código ingresado es incorrecto. Verifica tu aplicación de autenticación.');
      } else if (errCode === 'rate_limited') {
        setError('Demasiados intentos fallidos. Por favor espera unos minutos antes de intentar de nuevo.');
      } else {
        setError(axiosErr.response?.data?.message || 'Error al validar el código de seguridad.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setCode('');
    setError(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || config.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paso de elevación de seguridad (Step-Up)
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {description || config.desc}
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Código de la aplicación autenticadora
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                placeholder="123456"
                autoFocus
                disabled={loading}
                className="w-full pl-11 pr-4 py-2.5 text-center tracking-widest text-lg font-mono rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-red-700 dark:text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || code.trim().length !== 6}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Verificando...' : 'Autorizar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

