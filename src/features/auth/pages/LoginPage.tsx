import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, KeyRound, Copy, Check, Download, Key, Loader2 } from 'lucide-react';
import { BrowserQRCodeSvgWriter } from '@zxing/library';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { PublicAction } from '../../../components/ui/PublicAction';
import { AuthStage } from '../../public/components/AuthStage';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { useLogin } from '../hooks/useLogin';

export function LoginPage() {
  const login = useLogin();
  const {
    currentStep, setCurrentStep, mfaMode, setMfaMode, isLoading, errorMessage, setErrorMessage, shakeKey,
    username, setUsername, currentPassword, setCurrentPassword, newPassword, setNewPassword,
    totpCode, setTotpCode, recoveryCode, setRecoveryCode,
    showPassword, setShowPassword, showErrorsInChecklist, setShowErrorsInChecklist,
    handleLoginSubmit, handleChangePasswordSubmit, handleMfaSubmit, handleCancelMfa,
    // Enrollment state & actions
    enrollmentSubStep,
    enrollmentData, enrollmentCode, setEnrollmentCode,
    enrollmentRecoveryCodes, copiedKey, copiedCodes,
    handleConfirmEnrollment, handleFinishEnrollment, handleCancelEnrollment,
    handleCopyKey, handleCopyCodes, handleDownloadCodes
  } = login;

  const [showManualKey, setShowManualKey] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title =
      currentStep === 'MFA_CHALLENGE' ? 'Verificación de dos pasos | Comerzia' :
      currentStep === 'MFA_ENROLLMENT' ? 'Configuración obligatoria de MFA | Comerzia' :
      'Ingresa a tu empresa | Comerzia';
  }, [currentStep]);

  // Render QR Code locally via @zxing/library
  useEffect(() => {
    if (currentStep === 'MFA_ENROLLMENT' && enrollmentSubStep === 'SETUP' && enrollmentData?.otpauthUri && qrContainerRef.current) {
      try {
        const writer = new BrowserQRCodeSvgWriter();
        const svg = writer.write(enrollmentData.otpauthUri, 180, 180);
        qrContainerRef.current.innerHTML = '';
        qrContainerRef.current.appendChild(svg);
      } catch {
        // Fallback handled by manual key
      }
    }
  }, [currentStep, enrollmentSubStep, enrollmentData]);

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
        <span className="public-eyebrow">
          {currentStep === 'MFA_CHALLENGE' ? 'SEGURIDAD ADICIONAL' :
           currentStep === 'MFA_ENROLLMENT' ? (enrollmentSubStep === 'SETUP' ? 'POLÍTICA OBLIGATORIA DE ACCESO' : 'CÓDIGOS DE RESPALDO') :
           'TU NEGOCIO TE ESPERA'}
        </span>
        <h1>
          {currentStep === 'LOGIN' ? 'Qué bueno verte.' :
           currentStep === 'CHANGE_PASSWORD' ? 'Un acceso más seguro.' :
           currentStep === 'MFA_CHALLENGE' ? 'Doble factor' :
           (enrollmentSubStep === 'SETUP' ? 'Configura tu segundo factor' : 'Códigos de respaldo generados')}
        </h1>
        <p className="public-form-description">
          {currentStep === 'LOGIN' ? 'Entra y continúa donde lo dejaste.' :
           currentStep === 'CHANGE_PASSWORD' ? 'Actualiza tu contraseña temporal para continuar.' :
           currentStep === 'MFA_CHALLENGE' ? (mfaMode === 'TOTP'
             ? 'Ingresa el código de 6 dígitos generado por tu aplicación autenticadora.'
             : 'Ingresa uno de tus códigos de recuperación de respaldo.') :
           (enrollmentSubStep === 'SETUP'
             ? 'Escanea el código QR con Google Authenticator para habilitar tu cuenta.'
             : 'Guarda estos códigos de recuperación en un lugar seguro. Solo se muestran una vez.')}
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
                  <span style={{ fontSize: '0.9rem' }}>{mfaMode === 'EMERGENCY' ? 'Usa la autorización temporal entregada por el procedimiento de recuperación' : 'Ingresa uno de tus 10 códigos de respaldo de un solo uso'}</span>
                </div>
                <ComerziaInput
                  id="mfa-recovery-code"
                  name="recoveryCode"
                  label={mfaMode === 'EMERGENCY' ? 'Autorización temporal' : 'Código de recuperación'}
                  maxLength={mfaMode === 'EMERGENCY' ? 64 : 32}
                  type="password"
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
            <button type="button" className="btn btn-ghost btn-sm w-full mt-3" disabled={isLoading}
              onClick={() => { setMfaMode('EMERGENCY'); setRecoveryCode(''); setErrorMessage(''); }}>
              Tengo una autorización de recuperación
            </button>
            <PublicAction type="button" className="public-action--back public-login-back" disabled={isLoading} onClick={handleCancelMfa}>
              Cancelar y volver al acceso
            </PublicAction>
          </form>
        )}

        {currentStep === 'MFA_ENROLLMENT' && enrollmentSubStep === 'SETUP' && (
          <form onSubmit={handleConfirmEnrollment}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '12px 0 20px 0' }}>
              <div
                ref={qrContainerRef}
                style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  minHeight: '180px',
                  minWidth: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!enrollmentData && <Loader2 className="animate-spin text-primary" size={32} />}
              </div>

              <button
                type="button"
                onClick={() => setShowManualKey(!showManualKey)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-primary, #10b981)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Key size={14} />
                {showManualKey ? 'Ocultar clave manual' : '¿No puedes escanear? Ingresar clave manual'}
              </button>

              {showManualKey && enrollmentData?.secret && (
                <div style={{ width: '100%', marginTop: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <code style={{ fontSize: '0.85rem', letterSpacing: '1px', wordBreak: 'break-all' }}>
                      {enrollmentData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      title="Copiar clave"
                    >
                      {copiedKey ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ComerziaInput
              id="mfa-enroll-confirm-code"
              name="enrollmentCode"
              label="Código de 6 dígitos mostrado en tu app"
              value={enrollmentCode}
              onChange={event => setEnrollmentCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              shakeKey={shakeKey}
              isRequired
              disabled={isLoading}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
            />

            <PublicAction type="submit" busy={isLoading} arrow>
              {isLoading ? 'Verificando y activando…' : 'Activar e ingresar'}
            </PublicAction>

            <PublicAction
              type="button"
              className="public-action--back public-login-back"
              disabled={isLoading}
              onClick={handleCancelEnrollment}
            >
              Cancelar y volver al acceso
            </PublicAction>
          </form>
        )}

        {currentStep === 'MFA_ENROLLMENT' && enrollmentSubStep === 'RECOVERY_CODES' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                margin: '16px 0'
              }}
            >
              {enrollmentRecoveryCodes.map((code, idx) => (
                <div key={idx} style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  {idx + 1}. {code}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handleCopyCodes}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {copiedCodes ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                {copiedCodes ? 'Copiados' : 'Copiar códigos'}
              </button>

              <button
                type="button"
                onClick={handleDownloadCodes}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <Download size={16} />
                Descargar .txt
              </button>
            </div>

            <PublicAction type="button" busy={isLoading} arrow onClick={handleFinishEnrollment}>
              {isLoading ? 'Iniciando sesión…' : 'Continuar a mi empresa'}
            </PublicAction>
          </div>
        )}

        <p className="public-account-link">
          ¿Aún no tienes tu espacio? <Link to="/registro">Crea tu empresa gratis</Link>
        </p>
      </div>
    </AuthStage>
  );
}
