import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff, LockKeyhole, Store } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { PublicAction } from '../../../components/ui/PublicAction';
import { useAuthStore } from '../../../stores/useAuthStore';
import { AuthStage } from '../components/AuthStage';
import { useRegistration } from '../hooks/useRegistration';
import { usePublicPlans, useRegistrationOptions } from '../hooks/usePublicCatalog';
import { generateSku } from '../../../utils/skuGenerator';
import type { RegistrationForm } from '../types/public';

const steps = ['Sobre ti', 'Tu acceso', 'Tu empresa'];
export function RegistrationPage() {
  const registration = useRegistration();
  const { data: options, isError, refetch } = useRegistrationOptions();
  const plans = usePublicPlans();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const { form, step, direction, errors, notice, busy, shakeKey, change, next, back } = registration;
  const [showPassword, setShowPassword] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { document.title = 'Crea tu empresa gratis | Comerzia'; }, []);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }, [step]);
  const branchCode = generateSku(form.branchName);
  const defaultRegisterName = options?.cashRegisterName || 'CAJA 01';
  const cashRegisterName = branchCode ? `CAJA 01 - ${branchCode}` : defaultRegisterName;
  const field = (key: keyof RegistrationForm, label: string, maxLength: number, autoComplete: string, required = true) =>
    <ComerziaInput id={`signup-${key}`} name={key} label={label} value={form[key]} maxLength={maxLength}
      type={key === 'email' ? 'email' : 'text'} onChange={event => change(key, event.target.value)} error={errors[key]}
      shakeKey={shakeKey} isRequired={required} autoComplete={autoComplete} disabled={busy} autoCapitalize={key === 'email' || key === 'username' ? 'none' : undefined} spellCheck={false} />;
  const freeAvailable = plans.data?.some(plan => plan.registrationAvailable) === true;
  return <AuthStage><div className="public-signup">
    {authenticated ? <div className="public-session-warning"><h1>Ya tienes una sesión abierta.</h1><p>Continúa en tu empresa o cierra sesión desde el sistema para crear otra cuenta.</p><Link className="public-action" to="/app">Ir a mi empresa</Link></div> : <>
      <div className="public-auth-heading"><span className="public-eyebrow">EMPIEZA CON FREE</span><div className="public-progress" aria-label={`Paso ${step + 1} de 3`}>{steps.map((label, index) => <span key={label} className={index <= step ? 'is-current' : ''}><i>{index < step ? <Check size={12} /> : index + 1}</i><span>{label}</span></span>)}</div></div>
      <form onSubmit={event => { event.preventDefault(); void next(); }} noValidate className="public-registration-form">
        <div key={step} className="public-step-content" data-direction={direction}><h1 ref={heading} tabIndex={-1}>{['Primero, tú.', 'Un acceso solo tuyo.', 'Dale nombre a tu idea.'][step]}</h1><p className="public-form-description">{['Queremos saber cómo llamarte.', 'Elige cómo entrarás a tu empresa.', 'Tu empresa y tu primera tienda, listas para empezar.'][step]}</p>
          {step === 0 && <>
            <PublicAction type="button" disabled className="public-google"><img src="/media/landing/google-g.png" width={18} height={18} alt="" /> Continuar con Google <small>Próximamente</small></PublicAction><div className="public-divider"><span>o con tu correo</span></div>
            {field('firstName', 'Nombres', 100, 'given-name')}<div className="public-field-row">{field('paternalSurname', 'Apellido paterno', 45, 'family-name', false)}{field('maternalSurname', 'Apellido materno', 45, 'off', false)}</div><p className="public-field-hint">Solo necesitas uno de tus apellidos.</p>{field('email', 'Correo electrónico', 100, 'email')}
          </>}
          {step === 1 && <>{field('username', 'Nombre de usuario', 40, 'username')}<p className="public-field-hint">Será tuyo. También podrás entrar con tu correo.</p>
            <ComerziaInput id="signup-password" name="password" label="Contraseña" type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={64} value={form.password} onChange={event => change('password', event.target.value)} error={errors.password} isRequired shakeKey={shakeKey} disabled={busy}
              rightAction={<PublicAction type="button" className="public-icon-button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</PublicAction>} />
            <p className="public-field-hint">8 a 64 caracteres. Incluye mayúscula, minúscula y número.</p><div className="public-privacy-note"><LockKeyhole size={19} /><p>Tu contraseña es privada. No la compartas con nadie.</p></div>
          </>}
          {step === 2 && <>{field('commercialName', 'Nombre de tu empresa', 150, 'organization')}{field('branchName', 'Nombre de tu primera tienda', 100, 'off')}
            <div className="public-setup-summary"><div className="public-setup-title"><Store size={19} /><strong>También dejamos listo</strong></div>
              {options ? <><div className="public-setup-register"><CheckCircle2 size={17} /><span>{cashRegisterName}<small>Caja de tu primera tienda · código {options.cashRegisterCode}</small></span></div><p>Todos tus roles incluidos</p><div className="public-role-list">{options.roles.map(role => <span key={role}><Check size={13} />{role}</span>)}</div></> : <p>{isError ? 'No se pudo cargar la configuración.' : 'Preparando tu espacio…'}</p>}
              {isError && <PublicAction type="button" className="public-action--outline" onClick={() => void refetch()}>Reintentar</PublicAction>}
            </div><p className="public-field-hint">Sin tarjeta. Free incluye tu cuenta y una tienda. Podrás configurar productos y abrir tu turno al entrar.</p>
          </>}
        </div>
        {notice && <div className="public-form-error" role="alert">{notice}{notice.includes('inicia sesión') || notice.includes('iniciar sesión') ? <> <Link to="/login">Ir al acceso</Link></> : null}</div>}
        {step === 2 && !freeAvailable && <p className="public-form-error" role="status">{plans.isError ? 'No se pudo verificar el plan Free.' : plans.isPending ? 'Verificando disponibilidad…' : 'El registro Free no está disponible ahora.'}{plans.isError && <PublicAction type="button" onClick={() => void plans.refetch()}>Reintentar</PublicAction>}</p>}
        <div className="public-step-actions">{step > 0 && <PublicAction type="button" className="public-action--back" onClick={back} disabled={busy}><ArrowLeft size={18} /> Atrás</PublicAction>}<PublicAction type="submit" busy={busy} arrow disabled={step === 2 && (!options || !freeAvailable)}>{busy ? 'Creando tu empresa…' : step === 2 ? 'Crear mi empresa gratis' : 'Continuar'}</PublicAction></div>
      </form><p className="public-account-link">¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
    </>}
  </div></AuthStage>;
}
