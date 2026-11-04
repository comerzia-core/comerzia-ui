import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { PublicAction } from '../../../components/ui/PublicAction';
import { AuthStage } from '../../public/components/AuthStage';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { useLogin } from '../hooks/useLogin';

export function LoginPage() {
  const login = useLogin();
  const { currentStep, setCurrentStep, mfaMode, setMfaMode, isLoading, errorMessage, setErrorMessage, shakeKey,
    username, setUsername, currentPassword, setCurrentPassword, newPassword, setNewPassword,
    totpCode, setTotpCode, recoveryCode, setRecoveryCode,
    showPassword, setShowPassword, showErrorsInChecklist, setShowErrorsInChecklist,
    handleLoginSubmit, handleChangePasswordSubmit, handleMfaSubmit, handleCancelMfa } = login;

  useEffect(() => {
    document.title = currentStep === 'MFA_CHALLENGE' ? 'Verificación de dos pasos | Comerzia' : 'Ingresa a tu empresa | Comerzia';
  }, [currentStep]);

  const reveal = <PublicAction type="button" className="public-icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</PublicAction>;

  return <AuthStage><div className="public-login">
    <span className="public-eyebrow">
      {currentStep === 'MFA_CHALLENGE' ? 'SEGURIDAD ADICIONAL' : 'TU NEGOCIO TE ESPERA'}
    </span>
    <h1>
      {currentStep === 'LOGIN' ? 'Qué bueno verte.' : currentStep === 'CHANGE_PASSWORD' ? 'Un acceso más seguro.' : 'Doble factor'}
    </h1>
    <p className="public-form-description">
      {currentStep === 'LOGIN'
        ? 'Entra y continúa donde lo dejaste.'
        : currentStep === 'CHANGE_PASSWORD'
        ? 'Actualiza tu contraseña temporal para continuar.'
        : (mfaMode === 'TOTP'
          ? 'Ingresa el código de 6 dígitos generado por tu aplicación autenticadora.'
          : 'Ingresa uno de tus códigos de recuperación de respaldo.')}
    </p>

    {errorMessage && <div className="public-form-error" role="alert">{errorMessage}</div>}

    {currentStep === 'LOGIN' && (
      <form onSubmit={handleLoginSubmit}>
        <ComerziaInput id="login-username" aria-label="Usuario o correo electrónico" name="username" label="Usuario o correo electrónico" value={username} onChange={event => setUsername(event.target.value)} shakeKey={shakeKey} isRequired disabled={isLoading} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        <ComerziaInput id="login-password" aria-label="Contraseña" name="password" label="Contraseña" type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} shakeKey={shakeKey} isRequired disabled={isLoading} autoComplete="current-password" rightAction={reveal} />
        <div className="public-forgot-password-wrap" style={{ textAlign: 'right', margin: '4px 0 12px 0' }}>
          <Link to="/recuperar-contrasena" className="public-forgot-password-link" style={{ fontSize: '0.85rem', color: 'var(--p, #3b82f6)' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <PublicAction type="submit" busy={isLoading} arrow>{isLoading ? 'Ingresando…' : 'Ir a mi empresa'}</PublicAction>
      </form>
    )}

    {currentStep === 'CHANGE_PASSWORD' && (
      <form onSubmit={handleChangePasswordSubmit}>
        <p className="public-login-alert">Tu contraseña temporal debe cambiarse antes del primer ingreso.</p>
        <ComerziaInput id="new-password" name="newPassword" label="Nueva contraseña" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={event => { setNewPassword(event.target.value); setShowErrorsInChecklist(false); }} shakeKey={shakeKey} isRequired disabled={isLoading} autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} rightAction={reveal} />
        <PasswordChecklist passwordValue={newPassword} showErrors={showErrorsInChecklist} />
        <PublicAction type="submit" busy={isLoading} arrow>Actualizar e ingresar</PublicAction>
        <PublicAction type="button" className="public-action--back public-login-back" disabled={isLoading} onClick={() => { setCurrentStep('LOGIN'); setErrorMessage(''); setNewPassword(''); setShowErrorsInChecklist(false); }}>Volver al acceso</PublicAction>
      </form>
    )}

    {currentStep === 'MFA_CHALLENGE' && (
      <form onSubmit={handleMfaSubmit}>
        {mfaMode === 'TOTP' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary, #64748b)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--brand-primary, #10b981)' }} />
              <span style={{ fontSize: '0.9rem' }}>Abre Google Authenticator u otra app TOTP</span>
            </div>
            <ComerziaInput
              id="mfa-totp-code"
              name="totpCode"
              label="Código de verificación (6 dígitos)"
              value={totpCode}
              onChange={event => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              shakeKey={shakeKey}
              isRequired
              disabled={isLoading}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
            />
            <div style={{ margin: '8px 0 16px 0', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setMfaMode('RECOVERY'); setErrorMessage(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary, #10b981)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                disabled={isLoading}
              >
                ¿No puedes acceder a tu app? Usar código de recuperación
              </button>
            </div>
            <PublicAction type="submit" busy={isLoading} arrow>{isLoading ? 'Verificando…' : 'Verificar e ingresar'}</PublicAction>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary, #64748b)' }}>
              <KeyRound size={20} style={{ color: 'var(--brand-primary, #10b981)' }} />
              <span style={{ fontSize: '0.9rem' }}>Ingresa uno de tus 10 códigos de respaldo de un solo uso</span>
            </div>
            <ComerziaInput
              id="mfa-recovery-code"
              name="recoveryCode"
              label="Código de recuperación"
              value={recoveryCode}
              onChange={event => setRecoveryCode(event.target.value.trim())}
              shakeKey={shakeKey}
              isRequired
              disabled={isLoading}
              autoComplete="off"
              placeholder="xxxx-xxxx-xx"
            />
            <div style={{ margin: '8px 0 16px 0', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setMfaMode('TOTP'); setErrorMessage(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary, #10b981)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                disabled={isLoading}
              >
                Volver a código de app autenticadora
              </button>
            </div>
            <PublicAction type="submit" busy={isLoading} arrow>{isLoading ? 'Verificando…' : 'Verificar código de respaldo'}</PublicAction>
          </>
        )}
        <PublicAction type="button" className="public-action--back public-login-back" disabled={isLoading} onClick={handleCancelMfa}>
          Cancelar y volver al acceso
        </PublicAction>
      </form>
    )}

    <p className="public-account-link">¿Aún no tienes tu espacio? <Link to="/registro">Crea tu empresa gratis</Link></p>
  </div></AuthStage>;
}
