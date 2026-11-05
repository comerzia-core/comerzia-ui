// src/features/public/hooks/useAcceptInvitation.ts
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { invitationService } from '../../employees/services/invitationService';
import { startGoogleInvitationAuth } from '../../auth/services/oidcService';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { InspectInvitationResponse, AcceptInvitationResponse } from '../../employees/types/invitation';

export function useAcceptInvitation() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Extraer token solo en memoria desde el fragmento o query string
  const [token] = useState<string | null>(() => {
    try {
      const url = new URL(window.location.href);
      return new URLSearchParams(url.hash.slice(1)).get('token') ?? url.searchParams.get('token');
    } catch {
      return null;
    }
  });

  // Estado de continuación Google si se regresa desde GoogleAuthResultPage
  const googleState = location.state as {
    googleContinuationToken?: string;
    email?: string;
    name?: string;
  } | null;

  const [googleContinuationToken] = useState<string | null>(
    googleState?.googleContinuationToken || null
  );

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
      url.searchParams.delete('token');
      url.hash = '';
      window.history.replaceState(window.history.state, '', url.pathname + url.search);
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
        const msg = axiosErr.response?.data?.message;

        if (code === 'invitation_unavailable') {
          setErrorMessage('El sistema de invitaciones se encuentra temporalmente fuera de servicio.');
        } else if (code === 'invitation_not_found') {
          setErrorMessage('Invitación no encontrada o el enlace no es válido.');
        } else {
          setErrorMessage(msg || 'No se pudo validar la invitación. Solicita un nuevo enlace.');
        }
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
    if (!token || submitting) return;
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

      setAcceptedOutcome(res);

      if (res.auth?.token) {
        await useAuthStore.getState().login(res.auth.token);
        navigate('/app', { replace: true });
      }
    } catch (err: unknown) {
      handleAcceptError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Aceptar con sesión activa existente del mismo tenant y correo
  const acceptWithActiveSession = async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await invitationService.acceptInvitation({
        token,
        method: 'PASSWORD'
      });

      setAcceptedOutcome(res);

      if (res.auth?.token) {
        await useAuthStore.getState().login(res.auth.token);
        navigate('/app', { replace: true });
      }
    } catch (err: unknown) {
      handleAcceptError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Aceptar con token OIDC de Google
  const acceptWithGoogle = async (overrideContinuationToken?: string) => {
    const contToken = overrideContinuationToken || googleContinuationToken;
    if (!token || !contToken || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await invitationService.acceptInvitation({
        token,
        method: 'GOOGLE',
        googleContinuationToken: contToken
      });

      setAcceptedOutcome(res);

      if (res.auth?.token) {
        await useAuthStore.getState().login(res.auth.token);
        navigate('/app', { replace: true });
      }
    } catch (err: unknown) {
      handleAcceptError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Iniciar conexión OIDC Google para invitación
  const startGoogleAcceptance = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { authorizationUrl } = await startGoogleInvitationAuth();
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      } else {
        throw new Error('oidc_unavailable');
      }
    } catch {
      setSubmitting(false);
      setErrorMessage('No se pudo conectar con el servicio de autenticación de Google.');
    }
  };

  const handleAcceptError = (err: unknown) => {
    const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
    const code = axiosErr.response?.data?.code;
    const msg = axiosErr.response?.data?.message;

    if (code === 'account_link_required') {
      setErrorMessage(
        'Ya existe una cuenta con este correo no vinculada a Google. Inicia sesión con tus credenciales para vincularla a esta empresa.'
      );
    } else if (code === 'invitation_conflict') {
      setErrorMessage('El nombre de usuario seleccionado ya está en uso. Por favor elige otro.');
    } else if (code === 'invitation_capacity_unavailable') {
      setErrorMessage('La empresa ha alcanzado el límite de usuarios de su suscripción. Contacta al administrador.');
    } else if (code === 'invitation_already_accepted') {
      setErrorMessage('Esta invitación ya fue aceptada por otro usuario.');
    } else if (code === 'invitation_revoked') {
      setErrorMessage('Esta invitación ha sido revocada.');
    } else if (code === 'invitation_expired') {
      setErrorMessage('Esta invitación ha expirado.');
    } else if (code === 'invitation_email_mismatch') {
      setErrorMessage('El correo electrónico de tu cuenta o sesión no coincide con el invitado.');
    } else if (code === 'invitation_invalid_state') {
      setErrorMessage(msg || 'El estado de la invitación o empresa no permite completar la operación.');
    } else {
      setErrorMessage(msg || 'Ocurrió un error al procesar la aceptación. Inténtalo nuevamente.');
    }
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

