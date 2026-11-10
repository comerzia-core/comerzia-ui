import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldAlert, LogOut } from 'lucide-react';
import { useEmailChangeConfirmation } from '../../security/hooks/useEmailChangeConfirmation';
import { AuthStage } from '../components/AuthStage';
import { PublicAction } from '../../../components/ui/PublicAction';
import { BtnSave, BtnCancel } from '../../../components/ui/CrudButtons';
import { usePlatformConfig } from '../../../hooks/usePlatformConfig';

export const EmailChangePage: React.FC = () => {
  const { data: config } = usePlatformConfig();
  const privateMode = config ? config.platformMode === 'PRIVATE' : true;
  const { token, inspection, loading, confirmed, isConfirming, errorMessage, isSessionMismatch, isAuthenticated, logout, handleConfirm } = useEmailChangeConfirmation();
  const actionClass = privateMode ? 'btn btn-primary w-full' : 'public-action';
  const backClass = privateMode ? 'btn btn-ghost w-full' : 'public-action public-action--back';

  const content = (
    <AuthStage privateMode={privateMode} brandName={config?.brandName}>
      <div className={privateMode ? 'space-y-4' : 'public-login'}>
        {/* Enlace sin token de confirmación. */}
        {!token && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold text-base-content">Enlace incompleto</h1>
            <p className="text-sm text-base-content/70">
              No se proporcionó un token de cambio de correo. Si recibiste un correo, haz clic en el enlace completo.
            </p>
            <div className="pt-4">
              <Link to="/login" className={actionClass} style={{ width: '100%', textDecoration: 'none' }}>
                Ir a iniciar sesión <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* Inspección del enlace. */}
        {token && loading && (
          <div className="space-y-4 py-8 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium text-base-content/70">
              Validando enlace de confirmación...
            </p>
          </div>
        )}

        {/* Cambio confirmado. */}
        {token && !loading && confirmed && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-bold text-base-content">¡Correo Actualizado!</h1>
            <p className="text-sm text-base-content/70 leading-relaxed">
              Tu correo de acceso ha sido actualizado exitosamente. Por seguridad, tus sesiones anteriores han sido revocadas.
            </p>
            <div className="pt-3">
              <Link to="/login" className={actionClass} style={{ width: '100%', textDecoration: 'none' }}>
                Iniciar sesión con tu nuevo correo <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* Enlace inválido o sesión de otra cuenta. */}
        {token && !loading && !confirmed && errorMessage && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              {isSessionMismatch ? <ShieldAlert size={36} /> : <XCircle size={36} />}
            </div>
            <h1 className="text-xl font-bold text-base-content">
              {isSessionMismatch ? 'Aislamiento de Sesión' : 'Enlace No Válido'}
            </h1>
            <div className="p-3 bg-error/10 text-error rounded-xl text-xs sm:text-sm font-medium text-left">
              {errorMessage}
            </div>
            {isSessionMismatch ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-base-content/70">
                  Por seguridad, no puedes confirmar el cambio de correo de otra cuenta mientras tienes una sesión abierta diferente.
                </p>
                {isAuthenticated && (privateMode ?
                  <BtnCancel label="Cerrar sesión actual" onClick={() => void logout()} className="w-full" /> :
                  <PublicAction
                    type="button"
                    onClick={() => void logout()}
                    className="public-action public-action--back"
                    style={{ width: '100%' }}
                  >
                    <LogOut size={16} /> Cerrar sesión actual
                  </PublicAction>
                )}
              </div>
            ) : (
              <p className="text-xs text-base-content/60">
                Los enlaces de confirmación son de uso único y expiran por seguridad. Puedes solicitar uno nuevo desde tu perfil.
              </p>
            )}
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login" className={actionClass} style={{ width: '100%', textDecoration: 'none' }}>
                Ir a iniciar sesión <ArrowRight size={18} />
              </Link>
              <Link to="/" className={backClass} style={{ width: '100%', textDecoration: 'none' }}>
                Volver al inicio
              </Link>
            </div>
          </div>
        )}

        {/* Enlace válido, pendiente de confirmación explícita. */}
        {token && !loading && !confirmed && !errorMessage && inspection?.valid && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <MailCheck size={36} />
            </div>
            <span className={privateMode ? 'text-xs font-semibold text-primary tracking-wide' : 'public-eyebrow'}>CONFIRMACIÓN DE IDENTIDAD</span>
            <h1 className="text-2xl font-bold text-base-content">Confirmar nuevo correo</h1>
            <p className="text-sm text-base-content/70">
              Estás a punto de confirmar tu nueva dirección de correo de acceso:
            </p>

            {inspection.maskedEmail && (
              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="font-mono font-bold text-sm text-base-content">
                  {inspection.maskedEmail}
                </span>
              </div>
            )}

            <div className="text-xs text-base-content/70 bg-warning/10 p-3 rounded-xl border border-warning/20 text-left flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-warning mt-0.5" />
              <span>
                Al confirmar, este pasará a ser tu correo de acceso oficial y se cerrarán todas las sesiones activas en tus dispositivos.
              </span>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              {privateMode ? <BtnSave label="Confirmar mi nuevo correo electrónico" onClick={handleConfirm}
                isLoading={isConfirming} className="w-full" /> : <PublicAction
                type="button"
                onClick={handleConfirm}
                busy={isConfirming}
                arrow
                style={{ width: '100%' }}
              >
                {isConfirming ? 'Confirmando nuevo correo…' : 'Confirmar mi nuevo correo electrónico'}
              </PublicAction>}
              <Link to="/login" className={backClass} style={{ width: '100%', textDecoration: 'none' }}>
                Volver al acceso
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthStage>
  );
  return content;
};
