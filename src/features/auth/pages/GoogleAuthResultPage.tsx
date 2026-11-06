import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AuthStage } from '../../public/components/AuthStage';
import { PublicAction } from '../../../components/ui/PublicAction';
import { completeGoogleAuth, confirmGoogleLink } from '../services/oidcService';
import { resolveOidcMessage } from '../utils/oidcMessages';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { OidcCompleteResponse } from '../types/oidc';
import { rememberGoogleRegistration, rememberGoogleInvitation } from '../utils/oidcContinuation';

export function GoogleAuthResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryError = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(!queryError);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    queryError ? resolveOidcMessage(queryError) : null
  );
  const [outcome, setOutcome] = useState<OidcCompleteResponse | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    document.title = 'Autenticación con Google | Comerzia';
    if (queryError || processedRef.current) return;
    processedRef.current = true;

    async function processComplete() {
      try {
        const result = await completeGoogleAuth();
        setOutcome(result);

        if (result.status === 'AUTHENTICATED' && result.auth?.token) {
          await useAuthStore.getState().login(result.auth.token);
          navigate('/app', { replace: true });
          return;
        }

        if (result.status === 'REGISTRATION_REQUIRED' && result.registrationToken) {
          rememberGoogleRegistration({ registrationToken: result.registrationToken, email: result.email, name: result.name });
          navigate('/registro', { replace: true });
          return;
        }

        if (result.status === 'INVITATION_VERIFIED' && result.continuationToken && result.invitationReferenceToken) {
          rememberGoogleInvitation({ token: result.invitationReferenceToken, googleContinuationToken: result.continuationToken });
          navigate('/aceptar-invitacion', { replace: true });
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
  }, [queryError, navigate]);

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

