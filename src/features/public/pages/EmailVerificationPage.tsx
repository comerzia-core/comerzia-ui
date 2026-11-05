import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { usePublicEmailVerification } from '../../security/hooks/usePublicEmailVerification';
import { AuthStage } from '../components/AuthStage';
import { PublicAction } from '../../../components/ui/PublicAction';

export const EmailVerificationPage: React.FC = () => {
  const { token, inspection, loading, confirmed, errorMessage, confirmMutation, handleConfirm } = usePublicEmailVerification();

  return (
    <AuthStage>
      <div className="public-login">
        {/* State 1: No token provided */}
        {!token && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold text-base-content">Enlace incompleto</h1>
            <p className="text-sm text-base-content/70">
              No se proporcionó un token de verificación. Si recibiste un correo, asegúrate de hacer clic en el enlace completo.
            </p>
            <div className="pt-4">
              <Link to="/login" className="public-action" style={{ width: '100%', textDecoration: 'none' }}>
                Ir a iniciar sesión <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* State 2: Inspecting token */}
        {token && loading && (
          <div className="space-y-4 py-8 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium text-base-content/70">
              Validando enlace de seguridad...
            </p>
          </div>
        )}

        {/* State 3: Confirmed successfully */}
        {token && !loading && confirmed && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-bold text-base-content">¡Correo Verificado!</h1>
            <p className="text-sm text-base-content/70 leading-relaxed">
              Tu dirección de correo electrónico ha sido confirmada exitosamente. Tu cuenta ahora cuenta con este canal verificado para seguridad y notificaciones.
            </p>
            <div className="pt-3 flex flex-col gap-3">
              <Link to="/dashboard" className="public-action" style={{ width: '100%', textDecoration: 'none' }}>
                Ir al panel principal <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="public-action public-action--back" style={{ width: '100%', textDecoration: 'none' }}>
                Iniciar sesión con otra cuenta
              </Link>
            </div>
          </div>
        )}

        {/* State 4: Token invalid / expired / consumed error */}
        {token && !loading && !confirmed && errorMessage && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              <XCircle size={36} />
            </div>
            <h1 className="text-xl font-bold text-base-content">Enlace No Válido</h1>
            <div className="p-3 bg-error/10 text-error rounded-xl text-xs sm:text-sm font-medium text-left">
              {errorMessage}
            </div>
            <p className="text-xs text-base-content/60">
              Los enlaces de verificación son de uso único y expiran por seguridad. Puedes solicitar uno nuevo desde tu perfil de usuario.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login" className="public-action" style={{ width: '100%', textDecoration: 'none' }}>
                Iniciar sesión <ArrowRight size={18} />
              </Link>
              <Link to="/" className="public-action public-action--back" style={{ width: '100%', textDecoration: 'none' }}>
                Volver al inicio
              </Link>
            </div>
          </div>
        )}

        {/* State 5: Token valid, ready for user confirmation */}
        {token && !loading && !confirmed && !errorMessage && inspection?.valid && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <MailCheck size={36} />
            </div>
            <span className="public-eyebrow">CANAL DE CONTACTO OFICIAL</span>
            <h1 className="text-2xl font-bold text-base-content">Confirmar verificación</h1>
            <p className="text-sm text-base-content/70">
              Estás a punto de verificar tu dirección de correo electrónico:
            </p>
            {inspection.maskedEmail && (
              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="font-mono font-bold text-sm text-base-content">
                  {inspection.maskedEmail}
                </span>
              </div>
            )}
            <div className="p-3 bg-base-200/60 rounded-xl text-xs text-base-content/70 flex items-center gap-2 text-left">
              <ShieldCheck size={18} className="text-primary shrink-0" />
              <span>
                Para proteger tu seguridad frente a escáneres automáticos de correo, confirma tu acción haciendo clic abajo.
              </span>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <PublicAction
                type="button"
                onClick={handleConfirm}
                busy={confirmMutation.isPending}
                arrow
                style={{ width: '100%' }}
              >
                {confirmMutation.isPending ? 'Confirmando…' : 'Confirmar mi correo electrónico'}
              </PublicAction>
              <Link to="/login" className="public-action public-action--back" style={{ width: '100%', textDecoration: 'none' }}>
                Volver al acceso
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthStage>
  );
};
