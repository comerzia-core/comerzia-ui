import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { PublicAction } from '../../../components/ui/PublicAction';
import { AuthStage } from '../../public/components/AuthStage';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { useLogin } from '../hooks/useLogin';

export function LoginPage() {
  const login = useLogin();
  const { currentStep, isLoading, errorMessage, shakeKey, username, setUsername, currentPassword, setCurrentPassword,
    newPassword, setNewPassword, showPassword, setShowPassword, showErrorsInChecklist, setShowErrorsInChecklist,
    handleLoginSubmit, handleChangePasswordSubmit, setCurrentStep, setErrorMessage } = login;
  useEffect(() => { document.title = 'Ingresa a tu empresa | Comerzia'; }, []);
  const reveal = <PublicAction type="button" className="public-icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</PublicAction>;
  return <AuthStage><div className="public-login"><span className="public-eyebrow">TU NEGOCIO TE ESPERA</span>
    <h1>{currentStep === 'LOGIN' ? 'Qué bueno verte.' : 'Un acceso más seguro.'}</h1>
    <p className="public-form-description">{currentStep === 'LOGIN' ? 'Entra y continúa donde lo dejaste.' : 'Actualiza tu contraseña temporal para continuar.'}</p>
    {errorMessage && <div className="public-form-error" role="alert">{errorMessage}</div>}
    {currentStep === 'LOGIN' ? <form onSubmit={handleLoginSubmit}>
      <ComerziaInput id="login-username" aria-label="Usuario o correo electrónico" name="username" label="Usuario o correo electrónico" value={username} onChange={event => setUsername(event.target.value)} shakeKey={shakeKey} isRequired disabled={isLoading} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <ComerziaInput id="login-password" aria-label="Contraseña" name="password" label="Contraseña" type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} shakeKey={shakeKey} isRequired disabled={isLoading} autoComplete="current-password" rightAction={reveal} />
      <PublicAction type="submit" busy={isLoading} arrow>{isLoading ? 'Ingresando…' : 'Ir a mi empresa'}</PublicAction>
    </form> : <form onSubmit={handleChangePasswordSubmit}>
      <p className="public-login-alert">Tu contraseña temporal debe cambiarse antes del primer ingreso.</p>
      <ComerziaInput id="new-password" name="newPassword" label="Nueva contraseña" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={event => { setNewPassword(event.target.value); setShowErrorsInChecklist(false); }} shakeKey={shakeKey} isRequired disabled={isLoading} autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} rightAction={reveal} />
      <PasswordChecklist passwordValue={newPassword} showErrors={showErrorsInChecklist} />
      <PublicAction type="submit" busy={isLoading} arrow>Actualizar e ingresar</PublicAction>
      <PublicAction type="button" className="public-action--back public-login-back" disabled={isLoading} onClick={() => { setCurrentStep('LOGIN'); setErrorMessage(''); setNewPassword(''); setShowErrorsInChecklist(false); }}>Volver al acceso</PublicAction>
    </form>}
    <p className="public-account-link">¿Aún no tienes tu espacio? <Link to="/registro">Crea tu empresa gratis</Link></p>
  </div></AuthStage>;
}
