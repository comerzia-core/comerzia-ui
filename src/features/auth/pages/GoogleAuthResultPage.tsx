import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { AuthStage } from '../../public/components/AuthStage';
import { PublicAction } from '../../../components/ui/PublicAction';
import { BtnLogin } from '../../../components/ui/CrudButtons';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { completeGoogleAuth, confirmGoogleLink } from '../services/oidcService';
import { resolveOidcMessage } from '../utils/oidcMessages';
import { useAuthStore } from '../../../stores/useAuthStore';
import { usePlatformConfig } from '../../../hooks/usePlatformConfig';
import type { OidcCompleteResponse } from '../types/oidc';
import { rememberGoogleRegistration, rememberGoogleInvitation } from '../utils/oidcContinuation';

export function GoogleAuthResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryError = searchParams.get('error');

  const { data: platformConfig } = usePlatformConfig();
  const isPrivate = platformConfig ? (platformConfig.platformMode === 'PRIVATE' || !platformConfig.publicLandingEnabled) : true;
  const brandName = platformConfig?.brandName || 'Comerzia ERP';

  const [isLoading, setIsLoading] = useState(!queryError);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    queryError ? resolveOidcMessage(queryError) : null
  );
  const [outcome, setOutcome] = useState<OidcCompleteResponse | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    document.title = `Autenticación con Google | ${brandName}`;
    if (queryError || processedRef.current) return;
    processedRef.current = true;

    async function processComplete() {
      try {
        // El refresh inicial anónimo puede limpiar continuaciones: debe terminar antes del retorno OAuth.
        await useAuthStore.getState().initializeSession();
        const result = await completeGoogleAuth();
        setOutcome(result);

        if (result.status === 'AUTHENTICATED' && result.auth?.token) {
          await useAuthStore.getState().login(result.auth.token);
          navigate('/app', { replace: true });
          return;
        }

        if (result.status === 'REGISTRATION_REQUIRED' && result.registrationToken) {
          if (isPrivate) {
            // En modo privado no redirigimos a /register (está inhabilitado),
            // mostramos la advertencia corporativa en pantalla con estilo DaisyUI.
            setIsLoading(false);
            return;
          }
          rememberGoogleRegistration({ registrationToken: result.registrationToken, email: result.email, name: result.name });
          navigate('/register', { replace: true });
          return;
        }

        if (result.status === 'INVITATION_VERIFIED' && result.continuationToken && result.invitationReferenceToken) {
          rememberGoogleInvitation({ token: result.invitationReferenceToken, googleContinuationToken: result.continuationToken });
          navigate('/accept-invitation', { replace: true });
          return;
        }

        if (result.status === 'REAUTH_VERIFIED') {
          navigate('/profile?tab=security', { replace: true });
          return;
        }

        if (result.status === 'LINK_VERIFIED' && result.linkToken) {
          try {
            await confirmGoogleLink(result.linkToken);
            navigate('/profile?tab=security', { replace: true });
            return;
          } catch (linkErr: unknown) {
            const errCode = (linkErr as { response?: { data?: { code?: string } } })?.response?.data?.code;
            setErrorMessage(resolveOidcMessage(errCode, 'No se pudo confirmar la vinculación de la cuenta de Google.'));
            setIsLoading(false);
            return;
          }
        }

        if (result.status === 'MFA_PENDING' || result.status === 'MFA_ENROLLMENT_REQUIRED' || result.status === 'RECOVERY_RESTRICTED') {
          useAuthStore.getState().requireAdditionalAuthentication();
          navigate('/login', {
            replace: true,
            state: {
              federatedMfa: {
                status: result.status,
                email: result.email
              }
            }
          });
          return;
        }

        setIsLoading(false);
      } catch (err: unknown) {
        setIsLoading(false);
        const errCode = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
        setErrorMessage(resolveOidcMessage(errCode, 'No se pudo completar la verificación con Google.'));
      }
    }

    void processComplete();
  }, [queryError, navigate, isPrivate, brandName]);

  // =========================================================================
  // VISTA PARA SERVIDOR VPS PRIVADO (Diseño DaisyUI Corporativo)
  // =========================================================================
  if (isPrivate) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            {isLoading && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary text-primary-content rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                  <Loader2 size={32} className="animate-spin" />
                </div>
                <h2 className="text-2xl font-black">{brandName}</h2>
                <p className="text-base-content/60 text-sm mt-1">Verificando con Google…</p>
                <p className="text-xs text-base-content/50 mt-4">Estamos procesando tu autenticación de forma segura.</p>
              </div>
            )}

            {!isLoading && outcome?.status === 'ACCOUNT_LINK_REQUIRED' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-warning text-warning-content rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                    <ShieldAlert size={32} />
                  </div>
                  <h2 className="text-2xl font-black">{brandName}</h2>
                  <p className="text-base-content/60 text-sm mt-1">Vinculación de cuenta requerida</p>
                </div>

                <div className="alert alert-warning text-sm rounded-xl py-3 mb-4 shadow-xs" role="alert">
                  <div className="space-y-2 text-xs sm:text-sm text-left">
                    <p>
                      Ya existe una cuenta en <strong>{brandName}</strong> registrada con el correo <strong>{outcome.email}</strong>.
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed">
                      Por políticas estrictas de seguridad corporativa, <strong>no vinculamos cuentas automáticamente</strong>. Para conectar tu cuenta de Google, inicia sesión con tu usuario y contraseña habitual y realiza la vinculación desde <strong>Perfil &gt; Seguridad</strong>.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <BtnLogin
                    type="button"
                    label="Iniciar sesión con contraseña"
                    onClick={() => navigate('/login')}
                  />
                  <div className="text-center">
                    <Link to="/login" className="text-xs text-base-content/60 hover:text-primary transition-colors">
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && outcome?.status === 'REGISTRATION_REQUIRED' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-error text-error-content rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                    <AlertTriangle size={32} />
                  </div>
                  <h2 className="text-2xl font-black">{brandName}</h2>
                  <p className="text-base-content/60 text-sm mt-1">Acceso no autorizado</p>
                </div>

                <div className="alert alert-error text-sm rounded-xl py-3 mb-4 shadow-xs" role="alert">
                  <div className="space-y-2 text-xs sm:text-sm text-left">
                    <p>
                      El correo <strong>{outcome.email}</strong> no está asociado a ningún usuario ni empresa activa en este servidor privado.
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed">
                      En esta plataforma el registro público está inhabilitado. Si eres colaborador de una empresa, solicita a tu administrador que dé de alta tu usuario o te envíe una invitación de personal.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <BtnLogin
                    type="button"
                    label="Volver al inicio de sesión"
                    onClick={() => navigate('/login')}
                  />
                </div>
              </div>
            )}

            {!isLoading && errorMessage && outcome?.status !== 'ACCOUNT_LINK_REQUIRED' && outcome?.status !== 'REGISTRATION_REQUIRED' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-error text-error-content rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                    <AlertCircle size={32} />
                  </div>
                  <h2 className="text-2xl font-black">{brandName}</h2>
                  <p className="text-base-content/60 text-sm mt-1">No pudimos continuar</p>
                </div>

                <div className="alert alert-error text-sm rounded-xl py-3 mb-4 shadow-xs" role="alert">
                  <span className="text-xs sm:text-sm">{errorMessage}</span>
                </div>

                <div className="space-y-3 mt-6">
                  <BtnLogin
                    type="button"
                    label="Volver al inicio de sesión"
                    onClick={() => navigate('/login')}
                  />
                </div>
              </div>
            )}

            {!isLoading && outcome?.status === 'LINK_VERIFIED' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-success text-success-content rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-black">{brandName}</h2>
                <p className="text-base-content/60 text-sm mt-1">Cuenta vinculada con éxito</p>
                <p className="text-xs text-base-content/60 mt-2 mb-6">Tu cuenta de Google fue conectada correctamente a tu perfil.</p>
                <ComerziaButton
                  type="button"
                  variant="primary"
                  label="Ir a mi perfil"
                  fullWidth
                  onClick={() => navigate('/profile?tab=security')}
                />
              </div>
            )}

            <div className="text-center mt-6 pt-4 border-t border-base-200">
              <p className="text-xs text-base-content/50">
                ¿Necesitas ayuda?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Volver al acceso principal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA PARA SERVIDOR VPS PÚBLICO (Diseño Marketing AuthStage)
  // =========================================================================
  return (
    <AuthStage>
      <div className="public-login" style={{ textAlign: 'center' }}>
        <span className="public-eyebrow">IDENTIDAD FEDERADA</span>

        {isLoading && (
          <div style={{ padding: '40px 0' }}>
            <Loader2 size={36} className="animate-spin text-primary" style={{ margin: '0 auto 16px' }} />
            <h1>Verificando con Google…</h1>
            <p className="public-form-description">Estamos procesando tu autenticación de forma segura.</p>
          </div>
        )}

        {!isLoading && outcome?.status === 'ACCOUNT_LINK_REQUIRED' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShieldAlert size={28} style={{ color: 'var(--brand-primary, #10b981)' }} />
              <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Vinculación requerida</h1>
            </div>
            <div className="public-form-error" style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Ya existe una cuenta en Comerzia registrada con el correo <strong>{outcome.email}</strong>.
              </p>
              <p style={{ margin: 0 }}>
                Por políticas estrictas de seguridad, <strong>no vinculamos cuentas automáticamente</strong>.
                Para conectar tu cuenta de Google, inicia sesión con tu contraseña habitual y realiza la vinculación desde <strong>Perfil &gt; Seguridad</strong>.
              </p>
            </div>
            <div style={{ marginTop: '24px' }}>
              <PublicAction type="button" arrow onClick={() => navigate('/login')}>
                Iniciar sesión con contraseña
              </PublicAction>
            </div>
          </div>
        )}

        {!isLoading && errorMessage && outcome?.status !== 'ACCOUNT_LINK_REQUIRED' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertCircle size={28} style={{ color: '#ef4444' }} />
              <h1 style={{ fontSize: '1.4rem', margin: 0 }}>No pudimos continuar</h1>
            </div>
            <div className="public-form-error" role="alert">
              {errorMessage}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <PublicAction type="button" onClick={() => navigate('/login')}>
                Volver al inicio de sesión
              </PublicAction>
            </div>
          </div>
        )}

        {!isLoading && outcome?.status === 'LINK_VERIFIED' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <h1>Cuenta vinculada con éxito</h1>
            <p className="public-form-description">Tu cuenta de Google fue conectada correctamente a tu perfil.</p>
            <div style={{ marginTop: '20px' }}>
              <PublicAction type="button" arrow onClick={() => navigate('/profile?tab=security')}>
                Ir a mi perfil
              </PublicAction>
            </div>
          </div>
        )}

        <p className="public-account-link" style={{ marginTop: '30px' }}>
          ¿Necesitas ayuda? <Link to="/login">Volver al acceso principal</Link>
        </p>
      </div>
    </AuthStage>
  );
}
