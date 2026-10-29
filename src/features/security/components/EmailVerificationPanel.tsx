import React from 'react';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { Mail, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDateForUser } from '../../../utils/date';

interface EmailVerificationPanelProps {
  loginEmail?: string | null;
}

export const EmailVerificationPanel: React.FC<EmailVerificationPanelProps> = ({ loginEmail }) => {
  const { statusData, loading, cooldown, requestMutation, handleRequestVerification, currentEmail, isVerified, isPending, deliveryMessages } = useEmailVerification(loginEmail);

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
            <Mail size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-base-content flex items-center gap-2 flex-wrap">
              Verificación de Correo Electrónico
              {!loading && (
                <>
                  {isVerified && (
                    <span className="badge badge-success badge-sm gap-1 font-semibold py-2 px-2.5 text-success-content">
                      <CheckCircle2 size={12} /> Verificado
                    </span>
                  )}
                  {isPending && (
                    <span className="badge badge-warning badge-sm gap-1 font-semibold py-2 px-2.5 text-warning-content">
                      <Clock size={12} /> Pendiente
                    </span>
                  )}
                  {!isVerified && !isPending && (
                    <span className="badge badge-ghost badge-sm gap-1 font-semibold py-2 px-2.5 text-base-content/70">
                      <AlertCircle size={12} /> No verificado
                    </span>
                  )}
                </>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1 max-w-xl">
              {isVerified
                ? 'Tu dirección de correo está verificada.'
                : 'La verificación es opcional y no limita el uso del sistema ni tus ventas. Te recomendamos verificarla para asegurar que puedas recibir avisos de seguridad.'}
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-base-content/80">
              <span className="font-semibold">Correo de la cuenta:</span>
              <span className="font-mono bg-base-200 px-2 py-0.5 rounded text-xs">
                {currentEmail || 'Sin correo asociado'}
              </span>
            </div>

            {isVerified && statusData?.verifiedAt && (
              <p className="text-xs text-success mt-2 flex items-center gap-1 font-medium">
                <CheckCircle2 size={13} />
                Verificado el: {formatDateForUser(statusData.verifiedAt)}
              </p>
            )}
            {statusData?.deliveryState && (!isVerified || statusData.deliveryState === 'SUPPRESSED') && deliveryMessages[statusData.deliveryState] && (
              <p className="mt-2 text-xs text-base-content/70" role="status">{deliveryMessages[statusData.deliveryState]}</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!isVerified && currentEmail && (
          <div className="w-full sm:w-auto shrink-0 flex flex-col items-end gap-1.5 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={handleRequestVerification}
              disabled={requestMutation.isPending || cooldown > 0 || loading || ['UNAVAILABLE', 'SUPPRESSED'].includes(statusData?.deliveryState ?? '')}
              className="btn btn-primary btn-sm rounded-xl gap-2 w-full sm:w-auto"
            >
              {requestMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Enviando...
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Reenviar en {cooldown}s
                </>
              ) : (
                <>
                  <Mail size={14} />
                  {isPending ? 'Reenviar verificación' : 'Solicitar verificación'}
                </>
              )}
            </button>
            {cooldown > 0 && (
              <span className="text-[11px] text-base-content/50">
                Por seguridad espera antes de solicitar otro correo.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
