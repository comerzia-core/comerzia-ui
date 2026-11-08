// src/features/public/hooks/useAcceptInvitation.ts
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { invitationService } from '../../employees/services/invitationService';
import { startGoogleInvitationAuth } from '../../auth/services/oidcService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getGoogleInvitation, clearGoogleInvitation } from '../../auth/utils/oidcContinuation';
import { invitationLink, invitationErrorMessage } from '../../employees/utils/invitationFlow';
import type { InspectInvitationResponse, AcceptInvitationResponse } from '../../employees/types/invitation';

export function useAcceptInvitation() {
  const navigate = useNavigate();

  const [googleContinuation] = useState(getGoogleInvitation);
  const [token] = useState<string | null>(() => googleContinuation?.token ?? invitationLink(window.location.href).token);
  const googleContinuationToken = googleContinuation?.googleContinuationToken ?? null;
  const inFlight = useRef(false);

  const [inspection, setInspection] = useState<InspectInvitationResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedOutcome, setAcceptedOutcome] = useState<AcceptInvitationResponse | null>(null);

  // Sesión actual en el navegador
  const authUser = useAuthStore(state => state.userProfile);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // 2. Limpieza inmediata del token en la barra de direcciones (sin persistir en historial ni storages)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      window.history.replaceState(window.history.state, '', invitationLink(url.href).cleanPath);
    } catch {
      void 0;
    }
  }, []);

  // 3. Inspección segura por POST al montar
  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    invitationService
      .inspectInvitation(token, controller.signal)
      .then(res => {
        if (controller.signal.aborted) return;
        setInspection(res);

        if (res.status === 'ACCEPTED') {
          setErrorMessage('Esta invitación ya fue aceptada anteriormente.');
        } else if (res.status === 'REVOKED') {
          setErrorMessage('Esta invitación ha sido revocada por un administrador.');
        } else if (res.status === 'EXPIRED') {
          setErrorMessage('Esta invitación ha expirado. Solicita un nuevo enlace a tu administrador.');
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
        const code = axiosErr.response?.data?.code;
        setErrorMessage(invitationErrorMessage(code));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [token]);

  // 4. Aceptar como nuevo usuario con credenciales locales
  const acceptWithLocalCredentials = async (params: {
    username: string;
    password: string;
    firstName: string;
    paternalSurname: string;
    maternalSurname: string;
  }) => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    const expectedGeneration = useAuthStore.getState().generation;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await invitationService.acceptInvitation({
        token,
        method: 'PASSWORD',
        username: params.username.trim(),
        password: params.password,
        firstName: params.firstName.trim(),
        paternalSurname: params.paternalSurname.trim(),
        maternalSurname: params.maternalSurname.trim()
      });

      if (useAuthStore.getState().generation !== expectedGeneration) {
        clearGoogleInvitation();
        setErrorMessage('La sesión cambió. Vuelve a abrir la invitación con la cuenta correcta.');
        return;
      }
      clearGoogleInvitation();
      setAcceptedOutcome(res);

      if (res.auth?.token) {
        await useAuthStore.getState().login(res.auth.token);
        navigate('/app', { replace: true });
      } else if (res.auth?.mfaRequired || ['MFA_PENDING', 'MFA_ENROLLMENT_REQUIRED', 'RECOVERY_RESTRICTED'].includes(res.auth?.authenticationState ?? '')) {
        useAuthStore.getState().requireAdditionalAuthentication();
        navigate('/login', { replace: true, state: { federatedMfa: { status: res.auth?.authenticationState } } });
      }
    } catch (err: unknown) {
      handleAcceptError(err);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  // 5. Aceptar con sesión activa existente del mismo tenant y correo
  const acceptWithActiveSession = async () => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    const expectedGeneration = useAuthStore.getState().generation;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await invitationService.acceptInvitation({
        token,
        method: 'PASSWORD'
      });

      if (useAuthStore.getState().generation !== expectedGeneration) {
        clearGoogleInvitation();
        setErrorMessage('La sesión cambió. Vuelve a abrir la invitación con la cuenta correcta.');
        return;
      }
      clearGoogleInvitation();
      setAcceptedOutcome(res);

      if (res.auth?.token) {
        await useAuthStore.getState().login(res.auth.token);
        navigate('/app', { replace: true });
      } else if (res.auth?.mfaRequired || ['MFA_PENDING', 'MFA_ENROLLMENT_REQUIRED', 'RECOVERY_RESTRICTED'].includes(res.auth?.authenticationState ?? '')) {
        useAuthStore.getState().requireAdditionalAuthentication();
        navigate('/login', { replace: true, state: { federatedMfa: { status: res.auth?.authenticationState } } });
      }
    } catch (err: unknown) {
      handleAcceptError(err);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  // 6. Aceptar con token OIDC de Google
  const acceptWithGoogle = async (overrideContinuationToken?: string) => {
    const contToken = overrideContinuationToken || googleContinuationToken;
    if (!token || !contToken || inFlight.current) return;
    inFlight.current = true;
    const expectedGeneration = useAuthStore.getState().generation;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await invitationService.acceptInvitation({
        token,
        method: 'GOOGLE',
        googleContinuationToken: contToken
      });

      if (useAuthStore.getState().generation !== expectedGeneration) {
        clearGoogleInvitation();
        setErrorMessage('La sesión cambió. Vuelve a abrir la invitación con la cuenta correcta.');
        return;
      }
      clearGoogleInvitation();
      setAcceptedOutcome(res);

      if (res.auth?.token) {
        await useAuthStore.getState().login(res.auth.token);
        navigate('/app', { replace: true });
      } else if (res.auth?.mfaRequired || ['MFA_PENDING', 'MFA_ENROLLMENT_REQUIRED', 'RECOVERY_RESTRICTED'].includes(res.auth?.authenticationState ?? '')) {
        useAuthStore.getState().requireAdditionalAuthentication();
        navigate('/login', { replace: true, state: { federatedMfa: { status: res.auth?.authenticationState } } });
      }
    } catch (err: unknown) {
      handleAcceptError(err);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  // 7. Iniciar conexión OIDC Google para invitación
  const startGoogleAcceptance = async () => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const { authorizationUrl } = await startGoogleInvitationAuth(token);
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      } else {
        throw new Error('oidc_unavailable');
      }
    } catch {
      inFlight.current = false;
      setSubmitting(false);
      setErrorMessage('No se pudo conectar con el servicio de autenticación de Google.');
    }
  };

  const handleAcceptError = (err: unknown) => {
    const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
    const code = axiosErr.response?.data?.code;
    setErrorMessage(invitationErrorMessage(code));
  };

  return {
    token,
    inspection,
    loading,
    submitting,
    errorMessage,
    acceptedOutcome,
    isAuthenticated,
    authUser,
    googleContinuationToken,
    acceptWithLocalCredentials,
    acceptWithActiveSession,
    acceptWithGoogle,
    startGoogleAcceptance
  };
}

