import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { emailVerificationService } from '../services/emailVerificationService';
import type { PublicChallengeInspectionResponse } from '../types/emailVerification';

export function usePublicEmailVerification() {
  // El fragmento no viaja al servidor; los enlaces anteriores se limpian por compatibilidad.
  const [token] = useState(() => {
    const url = new URL(window.location.href);
    return new URLSearchParams(url.hash.slice(1)).get('token') ?? url.searchParams.get('token');
  });
  const [inspection, setInspection] = useState<PublicChallengeInspectionResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.hash = '';
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
    if (!token) return;
    const controller = new AbortController();
    void emailVerificationService.inspectToken(token, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setInspection(result);
      if (!result.valid) setErrorMessage('Enlace no disponible. Solicita uno nuevo.');
    }).catch(() => {
      if (!controller.signal.aborted) setErrorMessage('No se pudo validar el enlace. Intenta nuevamente.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [token]);

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Verification token is missing');
      return emailVerificationService.confirmVerification(token);
    },
    onSuccess: result => {
      if (result.success) setConfirmed(true);
      else setErrorMessage('No se pudo verificar el correo. Solicita un nuevo enlace.');
    },
    onError: () => setErrorMessage('No se pudo verificar el correo. Intenta nuevamente.'),
    // Evita conservar respuestas del enlace en la caché de mutaciones tras desmontar.
    gcTime: 0,
  });

  const handleConfirm = () => {
    if (token && inspection?.valid && !confirmMutation.isPending && !confirmed) confirmMutation.mutate();
  };

  return { token, inspection, loading, confirmed, errorMessage, confirmMutation, handleConfirm };
}
