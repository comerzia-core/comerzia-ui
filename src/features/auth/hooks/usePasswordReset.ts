import { useEffect, useState } from 'react';
import { passwordFeedback } from '../utils/passwordPolicy';
import { securityChallengeMessage } from '../../security/utils/securityChallengeMessages';
import { passwordResetService } from '../services/passwordResetService';
import type { PasswordResetInspectionResponse } from '../types/passwordReset';
import { useAuthStore } from '../../../stores/useAuthStore';

export function usePasswordReset() {
  // 1. Extraer el token del fragmento (#token=...) o query param y limpiar la URL inmediatamente
  const [token] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    return new URLSearchParams(url.hash.slice(1)).get('token') ?? url.searchParams.get('token');
  });

  // Estado para flujo con token (inspección y confirmación)
  const [inspection, setInspection] = useState<PasswordResetInspectionResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorsInChecklist, setShowErrorsInChecklist] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Estado para flujo sin token (solicitud por correo)
  const [email, setEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Limpieza inmediata de URL para no retener token en historial ni referrers
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
    void passwordResetService.inspectToken(token, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setInspection(result);
        if (!result.valid) {
          setConfirmError('El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setConfirmError('No se pudo validar el enlace de recuperación. Intenta nuevamente.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token]);

  // Manejo de cooldown de reenvío
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Limpieza estricta de contraseñas de memoria al desmontar
  useEffect(() => {
    return () => {
      setNewPassword('');
      setConfirmPassword('');
    };
  }, []);

  // Enviar solicitud de recuperación (sin token)
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequesting || cooldown > 0) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setShakeKey(k => k + 1);
      setRequestError('Ingresa un correo electrónico válido.');
      return;
    }

    setRequestError(null);
    setIsRequesting(true);

    try {
      await passwordResetService.requestReset({ email: trimmedEmail });
      setRequestSubmitted(true);
      setCooldown(60);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { code?: string; message?: string } } };
      const status = error.response?.status;
      if (status === 429) {
        setRequestError('Demasiadas solicitudes. Por favor espera antes de intentar nuevamente.');
        setCooldown(120);
      } else if (status === 503) {
        setRequestError('El servicio de correo no se encuentra disponible temporalmente. Intenta más tarde.');
      } else {
        setRequestError(securityChallengeMessage(err));
      }
    } finally {
      setIsRequesting(false);
    }
  };

  // Confirmar restablecimiento de contraseña (con token)
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirming || confirmed || !token) return;

    setShowErrorsInChecklist(true);

    const violation = passwordFeedback(newPassword);
    if (violation) {
      setShakeKey(k => k + 1);
      setConfirmError(violation);
      return;
    }

    if (newPassword !== confirmPassword) {
      setShakeKey(k => k + 1);
      setConfirmError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setConfirmError(null);
    setIsConfirming(true);

    try {
      const res = await passwordResetService.confirmReset(token, newPassword);
      if (res.success) {
        setConfirmed(true);
        // Si había una sesión activa en el navegador, la expiramos limpiamente
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().expireSession('session_password_changed');
        }
      } else {
        setConfirmError('No se pudo restablecer la contraseña.');
      }
    } catch (err: unknown) {
      setShakeKey(k => k + 1);
      setConfirmError(securityChallengeMessage(err));
    } finally {
      setIsConfirming(false);
      // Limpiar material de credencial de memoria inmediatamente
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return {
    token,
    inspection,
    loading,
    confirmed,
    confirmError,
    setConfirmError,
    isConfirming,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showErrorsInChecklist,
    setShowErrorsInChecklist,
    shakeKey,
    handleConfirmSubmit,

    email,
    setEmail,
    isRequesting,
    requestSubmitted,
    setRequestSubmitted,
    requestError,
    cooldown,
    handleRequestSubmit,
  };
}
