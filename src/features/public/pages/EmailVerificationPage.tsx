import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { usePublicEmailVerification } from '../../security/hooks/usePublicEmailVerification';

export const EmailVerificationPage: React.FC = () => {
  const { token, inspection, loading, confirmed, errorMessage, confirmMutation, handleConfirm } = usePublicEmailVerification();

  return (
    <div className="min-h-screen bg-base-200/50 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-base-100 shadow-xl border border-base-300 rounded-3xl p-6 sm:p-8 text-center animate-fade-in">
        {/* Brand Header */}
        <div className="mb-6 flex justify-center items-center gap-1.5">
          <span className="text-2xl font-black tracking-tight text-base-content">Comerzia</span>
          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
        </div>

        {/* State 1: No token provided */}
        {!token && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-base-content">Enlace incompleto</h2>
            <p className="text-sm text-base-content/70">
              No se proporcionó un token de verificación. Si recibiste un correo, asegúrate de hacer clic en el enlace completo.
            </p>
            <div className="pt-4">
              <Link to="/login" className="btn btn-primary btn-sm rounded-xl w-full">
                Ir a Iniciar Sesión
              </Link>
            </div>
          </div>
        )}

        {/* State 2: Inspecting token */}
        {token && loading && (
          <div className="space-y-4 py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium text-base-content/70">
              Validando enlace de seguridad...
            </p>
          </div>
        )}

        {/* State 3: Confirmed successfully */}
        {token && !loading && confirmed && (
          <div className="space-y-5">
            <div className="w-16 h-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-base-content">¡Correo Verificado!</h2>
            <p className="text-sm text-base-content/70 leading-relaxed">
              Tu dirección de correo electrónico ha sido confirmada exitosamente. Tu cuenta ahora cuenta con este canal verificado para seguridad y notificaciones.
            </p>
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/dashboard" className="btn btn-primary rounded-xl gap-2 w-full">
                Ir al Panel Principal <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-ghost btn-sm text-base-content/70">
                Iniciar sesión con otra cuenta
              </Link>
            </div>
          </div>
        )}

        {/* State 4: Token invalid / expired / consumed error */}
        {token && !loading && !confirmed && errorMessage && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              <XCircle size={36} />
            </div>
            <h2 className="text-xl font-bold text-base-content">Enlace No Válido</h2>
            <div className="p-3 bg-error/10 text-error rounded-xl text-xs sm:text-sm font-medium text-left">
              {errorMessage}
            </div>
            <p className="text-xs text-base-content/60">
              Los enlaces de verificación son de uso único y expiran por seguridad. Puedes solicitar uno nuevo desde tu perfil de usuario.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/login" className="btn btn-primary btn-sm rounded-xl w-full">
                Iniciar Sesión
              </Link>
              <Link to="/" className="btn btn-ghost btn-sm text-base-content/70">
                Volver al Inicio
              </Link>
            </div>
          </div>
        )}

        {/* State 5: Token valid, ready for user confirmation */}
        {token && !loading && !confirmed && !errorMessage && inspection?.valid && (
          <div className="space-y-5">
            <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <MailCheck size={36} />
            </div>
            <h2 className="text-xl font-bold text-base-content">Confirmar Verificación</h2>
            <p className="text-sm text-base-content/70">
              Estás a punto de verificar tu dirección de correo electrónico:
            </p>
            {inspection.maskedEmail && (
              <div className="py-2 px-4 bg-base-200 rounded-xl font-mono text-sm font-bold text-primary inline-block">
                {inspection.maskedEmail}
              </div>
            )}
            <div className="p-3 bg-base-200/60 rounded-xl text-xs text-base-content/70 flex items-center gap-2 text-left">
              <ShieldCheck size={18} className="text-primary shrink-0" />
              <span>
                Para proteger tu seguridad frente a escáneres automáticos de correo, confirma tu acción haciendo clic abajo.
              </span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="btn btn-primary rounded-xl w-full gap-2 text-base font-semibold shadow-md shadow-primary/20"
              >
                {confirmMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirmar mi correo electrónico
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-base-content/50">
        &copy; {new Date().getFullYear()} Comerzia SaaS &bull; Seguridad de Identidad
      </footer>
    </div>
  );
};
