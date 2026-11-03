import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight, MailCheck, KeyRound } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { PublicAction } from '../../../components/ui/PublicAction';
import { AuthStage } from '../components/AuthStage';
import { PasswordChecklist } from '../../auth/components/PasswordChecklist';
import { usePasswordReset } from '../../auth/hooks/usePasswordReset';

export function PasswordResetPage() {
  const {
    token,
    inspection,
    loading,
    confirmed,
    confirmError,
    isConfirming,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showErrorsInChecklist,
    shakeKey,
    handleConfirmSubmit,

    email,
    setEmail,
    isRequesting,
    requestSubmitted,
    requestError,
    cooldown,
    handleRequestSubmit,
  } = usePasswordReset();

  useEffect(() => {
    document.title = token
      ? 'Restablecer contraseña | Comerzia'
      : 'Recuperar contraseña | Comerzia';
  }, [token]);

  const reveal = (
    <PublicAction
      type="button"
      className="public-icon-button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </PublicAction>
  );

  return (
    <AuthStage>
      <div className="public-login">
        {/* ================================================================= */}
        {/* FLUJO CON TOKEN: INSPECCIÓN Y RESTABLECIMIENTO                    */}
        {/* ================================================================= */}
        {token ? (
          <>
            {loading && (
              <div className="space-y-4 py-8 text-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-sm font-medium text-base-content/70">
                  Validando enlace de recuperación...
                </p>
              </div>
            )}

            {!loading && confirmed && (
              <div className="space-y-5 text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <h1 className="text-2xl font-bold text-base-content">¡Contraseña Actualizada!</h1>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Tu contraseña ha sido restablecida exitosamente. Todas tus sesiones activas han sido cerradas por seguridad.
                </p>
                <div className="pt-3">
                  <Link
                    to="/login"
                    className="public-action"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    Iniciar sesión con nueva contraseña <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            )}

            {!loading && !confirmed && (!inspection?.valid || (confirmError && !inspection)) && (
              <div className="space-y-4 text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
                  <XCircle size={36} />
                </div>
                <h1 className="text-xl font-bold text-base-content">Enlace No Válido o Expirado</h1>
                <p className="text-sm text-base-content/70">
                  {confirmError || 'Este enlace de recuperación ya fue utilizado o ha vencido por seguridad.'}
                </p>
                <div className="pt-4 flex flex-col gap-3">
                  <Link
                    to="/recuperar-contrasena"
                    className="public-action"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    Solicitar un nuevo enlace
                  </Link>
                  <Link
                    to="/login"
                    className="public-action public-action--back"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    <ArrowLeft size={18} /> Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            )}

            {!loading && !confirmed && inspection?.valid && (
              <form onSubmit={handleConfirmSubmit} className="space-y-4 animate-fade-in">
                <span className="public-eyebrow">RECUPERACIÓN SEGURA</span>
                <h1>Crea una nueva contraseña</h1>
                <p className="public-form-description">
                  {inspection.maskedEmail
                    ? `Estás restableciendo el acceso para la cuenta ${inspection.maskedEmail}.`
                    : 'Ingresa una nueva contraseña segura para tu cuenta.'}
                </p>

                {confirmError && (
                  <div className="public-form-error" role="alert">
                    {confirmError}
                  </div>
                )}

                <ComerziaInput
                  id="reset-new-password"
                  name="newPassword"
                  label="Nueva contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  shakeKey={shakeKey}
                  isRequired
                  disabled={isConfirming}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  rightAction={reveal}
                  icon={<KeyRound size={16} className="text-base-content/40" />}
                />

                <PasswordChecklist passwordValue={newPassword} showErrors={showErrorsInChecklist} />

                <ComerziaInput
                  id="reset-confirm-password"
                  name="confirmPassword"
                  label="Confirmar nueva contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  shakeKey={shakeKey}
                  isRequired
                  disabled={isConfirming}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  icon={<KeyRound size={16} className="text-base-content/40" />}
                />

                <div className="pt-2 flex flex-col gap-3">
                  <PublicAction type="submit" busy={isConfirming} arrow style={{ width: '100%' }}>
                    {isConfirming ? 'Restableciendo…' : 'Restablecer contraseña'}
                  </PublicAction>
                  <Link
                    to="/login"
                    className="public-action public-action--back"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    <ArrowLeft size={18} /> Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            )}
          </>
        ) : (
          /* =============================================================== */
          /* FLUJO SIN TOKEN: SOLICITAR ENLACE DE RECUPERACIÓN               */
          /* =============================================================== */
          <>
            {requestSubmitted ? (
              <div className="space-y-5 text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <MailCheck size={36} />
                </div>
                <span className="public-eyebrow">CORREO ENVIADO</span>
                <h1 className="text-2xl font-bold text-base-content">Solicitud recibida</h1>
                <p className="text-sm text-base-content/70 leading-relaxed text-left bg-base-200/50 p-4 rounded-2xl border border-base-200">
                  Si la dirección ingresada corresponde a una cuenta elegible, recibirás un enlace de recuperación en los próximos minutos. Por seguridad, el enlace expira en 20 minutos.
                </p>
                <div className="pt-2 flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="public-action"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    Volver al inicio de sesión <ArrowRight size={18} />
                  </Link>
                  {cooldown > 0 ? (
                    <span className="text-xs text-base-content/50">
                      Podrás solicitar otro enlace en {cooldown} segundos.
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEmail('')}
                      className="public-action public-action--back"
                      style={{ width: '100%' }}
                    >
                      Probar con otra dirección
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4 animate-fade-in">
                <span className="public-eyebrow">SEGURIDAD DE LA CUENTA</span>
                <h1>¿Olvidaste tu contraseña?</h1>
                <p className="public-form-description">
                  Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para restablecer tu acceso.
                </p>

                {requestError && (
                  <div className="public-form-error" role="alert">
                    <AlertTriangle size={16} className="inline mr-1 text-error" />
                    {requestError}
                  </div>
                )}

                <ComerziaInput
                  id="reset-email"
                  name="email"
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  shakeKey={shakeKey}
                  isRequired
                  disabled={isRequesting}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ejemplo@empresa.com"
                />

                <div className="pt-2 flex flex-col gap-3">
                  <PublicAction type="submit" busy={isRequesting} arrow disabled={cooldown > 0} style={{ width: '100%' }}>
                    {isRequesting ? 'Enviando enlace…' : cooldown > 0 ? `Espera ${cooldown}s` : 'Enviar enlace de recuperación'}
                  </PublicAction>
                  <Link
                    to="/login"
                    className="public-action public-action--back"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    <ArrowLeft size={18} /> Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </AuthStage>
  );
}
