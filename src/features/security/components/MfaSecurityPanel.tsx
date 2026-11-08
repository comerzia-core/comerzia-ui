import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  KeyRound, 
  Loader2,
  RefreshCw,
  ShieldOff,
  AlertTriangle
} from 'lucide-react';
import { mfaProfileService } from '../services/mfaProfileService';
import type { MfaStatusResponse } from '../types/mfa';
import { MfaEnrollmentModal } from './MfaEnrollmentModal';
import { MfaStepUpModal } from './MfaStepUpModal';
import { MfaRecoveryCodesModal } from './MfaRecoveryCodesModal';
import { useStepUp } from '../hooks/useStepUp';

export const MfaSecurityPanel: React.FC = () => {
  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [enrollGrantToken, setEnrollGrantToken] = useState<string | undefined>(undefined);
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[]>([]);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const {
    isStepUpOpen,
    stepUpAction,
    stepUpTitle,
    stepUpDescription,
    requestStepUp,
    handleSuccess,
    handleCancel
  } = useStepUp();

  const fetchStatus = () => {
    setIsLoading(true);
    mfaProfileService.getMfaStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    mfaProfileService.getMfaStatus()
      .then(data => {
        if (isMounted) {
          setStatus(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEnrollmentSuccess = () => {
    setIsEnrollModalOpen(false);
    setEnrollGrantToken(undefined);
    fetchStatus();
  };

  const handleStartReplacement = async () => {
    setActionError(null);
    try {
      const grantToken = await requestStepUp('REPLACE_MFA', {
        title: 'Reemplazar autenticador',
        description: 'Ingresa el código actual de tu aplicación autenticadora para vincular un nuevo dispositivo o app.'
      });
      setEnrollGrantToken(grantToken);
      setIsEnrollModalOpen(true);
    } catch {
      // Step-up cancelled by user
    }
  };

  const handleRegenerateCodes = async () => {
    setActionError(null);
    try {
      const grantToken = await requestStepUp('REGENERATE_RECOVERY_CODES', {
        title: 'Regenerar códigos de respaldo',
        description: 'Ingresa tu código de autenticación actual. Los códigos de respaldo anteriores serán invalidados.'
      });

      setActionLoading(true);
      const res = await mfaProfileService.regenerateRecoveryCodes(grantToken);
      setRegeneratedCodes(res.recoveryCodes);
      setIsRecoveryModalOpen(true);
      fetchStatus();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      if (axiosErr.response?.data?.message) {
        setActionError(axiosErr.response.data.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setActionError(null);
    try {
      const grantToken = await requestStepUp('DEACTIVATE_MFA', {
        title: 'Desactivar autenticación en dos pasos',
        description: 'Estás a punto de desactivar el segundo factor. Ingresa tu código actual para confirmar.'
      });

      setActionLoading(true);
      await mfaProfileService.deactivateMfa(grantToken);
      fetchStatus();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      if (axiosErr.response?.data?.message) {
        setActionError(axiosErr.response.data.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-base-200/30 p-4 sm:p-5 rounded-2xl border border-base-200 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-base-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-base-content flex items-center gap-2">
              Autenticación en Dos Pasos (MFA / 2FA)
              {isLoading ? (
                <span className="badge badge-sm badge-ghost animate-pulse">Cargando...</span>
              ) : status?.configured ? (
                <span className="badge badge-sm badge-success gap-1 text-white">
                  <CheckCircle2 size={12} />
                  Activo
                </span>
              ) : (
                <span className="badge badge-sm badge-warning gap-1">
                  <ShieldAlert size={12} />
                  No configurado
                </span>
              )}
            </h3>
            <p className="text-xs text-base-content/60 mt-0.5">
              Protege el acceso a tu cuenta solicitando un código único desde tu teléfono al iniciar sesión.
            </p>
          </div>
        </div>

        {!isLoading && !status?.configured && (
          <button
            type="button"
            onClick={() => {
              setEnrollGrantToken(undefined);
              setIsEnrollModalOpen(true);
            }}
            className="btn btn-primary btn-sm gap-1.5 shrink-0"
          >
            <ShieldCheck size={16} />
            Activar autenticador
          </button>
        )}
      </div>

      <div className="pt-4">
        {actionError && (
          <div className="p-3 mb-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 text-xs">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-base-content/60 py-2">
            <Loader2 className="animate-spin" size={16} />
            <span>Consultando estado de seguridad...</span>
          </div>
        ) : status?.configured ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-base-100 rounded-xl border border-base-200 space-y-1">
                <span className="text-base-content/60 block font-medium">Método de autenticación</span>
                <span className="font-bold text-base-content flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-success" />
                  Aplicación TOTP ({status.factorType || 'Google/Microsoft Authenticator'})
                </span>
              </div>
              <div className="p-3 bg-base-100 rounded-xl border border-base-200 space-y-1">
                <span className="text-base-content/60 block font-medium">Códigos de respaldo restantes</span>
                <span className="font-bold text-base-content flex items-center gap-1.5">
                  <KeyRound size={14} className="text-primary" />
                  {status.recoveryCodesRemaining} de 10 disponibles
                </span>
              </div>
            </div>

            {status.enrolledAt && (
              <p className="text-[11px] text-base-content/50">
                Activado el: {new Date(status.enrolledAt).toLocaleDateString()} a las {new Date(status.enrolledAt).toLocaleTimeString()}
              </p>
            )}

            {/* Actions for active factor */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartReplacement}
                disabled={actionLoading}
                className="btn btn-outline btn-xs gap-1.5"
              >
                <RefreshCw size={13} />
                Reemplazar autenticador
              </button>
              <button
                type="button"
                onClick={handleRegenerateCodes}
                disabled={actionLoading}
                className="btn btn-outline btn-xs gap-1.5"
              >
                <KeyRound size={13} />
                Regenerar códigos
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1.5"
              >
                <ShieldOff size={13} />
                Desactivar 2FA
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-base-content/70 leading-relaxed">
            Te recomendamos activar la verificación en dos pasos para proteger tus datos y las operaciones comerciales de tu empresa contra accesos no autorizados.
          </p>
        )}
      </div>

      {isEnrollModalOpen && (
        <MfaEnrollmentModal
          isOpen={isEnrollModalOpen}
          onClose={() => {
            setIsEnrollModalOpen(false);
            setEnrollGrantToken(undefined);
          }}
          onSuccess={handleEnrollmentSuccess}
          initialGrantToken={enrollGrantToken}
        />
      )}

      {isStepUpOpen && (
        <MfaStepUpModal
          isOpen={isStepUpOpen}
          action={stepUpAction}
          title={stepUpTitle}
          description={stepUpDescription}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}

      {isRecoveryModalOpen && (
        <MfaRecoveryCodesModal
          isOpen={isRecoveryModalOpen}
          recoveryCodes={regeneratedCodes}
          onClose={() => setIsRecoveryModalOpen(false)}
        />
      )}
    </div>
  );
};
