import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailVerificationService } from '../services/emailVerificationService';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';

export function useEmailVerification(loginEmail?: string | null) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const sessionId = useAuthStore(state => state.sessionId);
  const generation = useAuthStore(state => state.generation);
  const [cooldown, setCooldown] = useState(0);

  const { data: statusData, isLoading: loading } = useQuery({
    queryKey: ['email-verification-status', sessionId, generation],
    enabled: !!sessionId,
    refetchInterval: query => ['QUEUED', 'SENDING'].includes(query.state.data?.deliveryState ?? '') ? 3000 : false,
    queryFn: async () => {
      const res = await emailVerificationService.getMyStatus();
      if (useAuthStore.getState().generation !== generation) throw new Error('Session changed during email status request');
      if (res.cooldownSecondsRemaining > 0) {
        setCooldown(res.cooldownSecondsRemaining);
      }
      return res;
    },
  });

  // Mantener visible el tiempo restante sin recargar toda la vista.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestMutation = useMutation({
    mutationFn: () => emailVerificationService.requestVerification(),
    onSuccess: (res) => {
      if (useAuthStore.getState().generation !== generation) return;
      if (res.queued) {
        toast.success('Solicitud recibida. Revisa tu correo en unos momentos.');
        setCooldown(res.cooldownSeconds || 60);
        void queryClient.invalidateQueries({ queryKey: ['email-verification-status', sessionId, generation] });
      } else if (res.code === 'ALREADY_VERIFIED') {
        toast.success('Tu correo ya está verificado.');
        void queryClient.invalidateQueries({ queryKey: ['email-verification-status', sessionId, generation] });
      } else {
        toast.error('Espera un momento antes de solicitar otro correo.');
        if (res.cooldownSeconds > 0) {
          setCooldown(res.cooldownSeconds);
        }
      }
    },
    onError: () => {
      if (useAuthStore.getState().generation !== generation) return;
      toast.error('No se pudo solicitar el correo. Intenta nuevamente.');
    },
  });

  const handleRequestVerification = () => {
    if (requestMutation.isPending || cooldown > 0) return;
    requestMutation.mutate();
  };

  const currentEmail = statusData?.email || loginEmail;
  const isVerified = statusData?.status === 'VERIFIED';
  const isPending = statusData?.status === 'PENDING';
  const deliveryMessages: Partial<Record<NonNullable<typeof statusData>['deliveryState'], string>> = {
    UNAVAILABLE: 'El envío no está disponible. Intenta más tarde.',
    SUPPRESSED: 'El envío requiere revisión de soporte. Puedes seguir usando el sistema.',
    QUEUED: 'Tu correo está en cola.', SENDING: 'Enviando correo.',
    ACCEPTED: 'Correo enviado al proveedor. Revisa tu bandeja.', SEND: 'Correo enviado al proveedor. Revisa tu bandeja.',
    DELIVERED: 'Correo entregado. Revisa tu bandeja o spam.',
    FAILED: 'No se pudo enviar el correo. Intenta nuevamente.', EXPIRED: 'La solicitud venció. Solicita otro correo.',
    CANCELLED: 'Solicita un nuevo correo de verificación.', BOUNCED: 'El correo fue rechazado. Contacta con soporte.',
    COMPLAINED: 'El envío está suspendido para este correo. Contacta con soporte.', REJECTED: 'El proveedor rechazó el correo.',
    SOFT_BOUNCE: 'El proveedor informó un problema de entrega.', DELAYED: 'La entrega está demorada.',
  };

  return { statusData, loading, cooldown, requestMutation, handleRequestVerification, currentEmail, isVerified, isPending, deliveryMessages };
}
