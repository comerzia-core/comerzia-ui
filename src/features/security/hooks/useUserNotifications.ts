import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/useAuthStore';
import { notificationService } from '../services/notificationService';
import type { NotificationItem } from '../types/notification';

export function useUserNotifications() {
  const sessionId = useAuthStore(state => state.sessionId);
  const generation = useAuthStore(state => state.generation);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['user-notifications', sessionId, generation],
    queryFn: () => notificationService.getMyNotifications(),
    enabled: !!sessionId,
    staleTime: 30000,
  });
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    void notificationService.reconcile().then(() => {
      if (active && useAuthStore.getState().generation === generation)
        void client.invalidateQueries({ queryKey: ['user-notifications', sessionId, generation] });
    }).catch(() => { /* La recomendacion opcional se recupera en otra sesion. */ });
    return () => { active = false; };
  }, [sessionId, generation, client]);
  const dismissMutation = useMutation({
    mutationFn: (reference: string) => notificationService.dismissNotification(reference),
    onSuccess: (_, reference) => {
      if (useAuthStore.getState().generation !== generation) return;
      client.setQueryData<NotificationItem[]>(['user-notifications', sessionId, generation], previous =>
        previous?.filter(item => item.reference !== reference) ?? []);
    },
  });
  const notifications = (query.data ?? []).map(item => item.type === 'SECURITY_EMAIL_VERIFICATION_RECOMMENDED'
    ? { ...item, title: 'Verifica tu correo', message: 'Protege tu cuenta verificando tu correo. Puedes hacerlo cuando quieras.' }
    : item.type === 'SECURITY_MFA_RECOVERY' ? { ...item, title: 'Recuperación de seguridad', message: 'Se registró una recuperación de 2FA. Si no la reconoces, contacta a soporte.' } : item);
  return { notifications, dismissMutation, isError: query.isError };
}
