import { useEffect, useState } from 'react';
import { emailChangeService } from '../services/emailChangeService';
import type { EmailChangeInspectionResponse } from '../types/emailChange';
import { useAuthStore } from '../../../stores/useAuthStore';
import { securityChallengeMessage, securityChallengeErrorCode } from '../utils/securityChallengeMessages';
export function useEmailChangeConfirmation() {
  const [token] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    return new URLSearchParams(url.hash.slice(1)).get('token') ?? url.searchParams.get('token');
  });

  const [inspection, setInspection] = useState<EmailChangeInspectionResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [confirmed, setConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSessionMismatch, setIsSessionMismatch] = useState(false);

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);

  // Limpiar el fragmento o parámetro de la URL inmediatamente al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.has('token')) {
      url.searchParams.delete('token');
      changed = true;
    }
    if (url.hash.includes('token=')) {
      url.hash = '';
      changed = true;
    }
    if (changed) {
      window.history.replaceState(window.history.state, '', url.pathname + url.search);
    }

    if (!token) return;

    const controller = new AbortController();
    void emailChangeService.inspectToken(token, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setInspection(result);
        if (!result.valid) {
          setErrorMessage('El enlace de cambio de correo no está disponible o ha expirado.');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setErrorMessage('No se pudo validar el enlace de cambio de correo. Intenta nuevamente.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token]);

  const handleConfirm = async () => {
    if (!token || isConfirming || confirmed) return;

    setIsConfirming(true);
    setErrorMessage(null);
    setIsSessionMismatch(false);

    try {
      const result = await emailChangeService.confirmChange(token);
      if (result.success) {
        setConfirmed(true);
        // Expirar la sesión actual de forma limpia sin generar tormenta de errores 401
        useAuthStore.getState().expireSession('session_email_changed');
      } else {
        setErrorMessage('No se pudo confirmar el cambio de correo.');
      }
    } catch (err: unknown) {
      setIsSessionMismatch(securityChallengeErrorCode(err) === 'email_change_session_mismatch');
      setErrorMessage(securityChallengeMessage(err));
    } finally {
      setIsConfirming(false);
    }
  };

  return { token, inspection, loading, confirmed, isConfirming, errorMessage, isSessionMismatch, isAuthenticated, logout, handleConfirm };
}
