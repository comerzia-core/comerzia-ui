import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useAuthStore } from '../../../stores/useAuthStore';
import { privilegedRecoveryService as service, type RecoveryAuthorization } from '../services/privilegedRecoveryService';
import { useStepUp } from './useStepUp';

export function usePrivilegedRecovery() {
  const stepUp = useStepUp();
  const generation = useAuthStore(state => state.generation);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['privileged-recovery', generation], queryFn: service.list, staleTime: 0 });
  const [authorization, setAuthorization] = useState<RecoveryAuthorization | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => useAuthStore.subscribe((current, previous) => {
    if (current.generation !== previous.generation) setAuthorization(null);
  }), []);
  useEffect(() => {
    if (!authorization) return;
    const timer = setTimeout(() => setAuthorization(null), Math.max(0, Date.parse(authorization.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [authorization]);
  const execute = async (kind: 'create' | 'approve' | 'issue', reference?: string, body?: { targetUsername: string; identityCase: string }) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const path = '/saas/security/privileged-recovery' + (reference ? `/${reference}/${kind}` : '');
      const payload = kind === 'create' ? body : kind === 'approve' ? { identityVerified: true } : null;
      const grant = await stepUp.requestStepUp('ADMIN_MFA_RECOVERY', { targetId: 'POST:' + path, body: payload });
      if (generation !== useAuthStore.getState().generation) throw new Error('step_up_session_changed');
      if (kind === 'create' && body) await service.create(body, grant);
      else if (kind === 'approve' && reference) await service.approve(reference, grant);
      else if (kind === 'issue' && reference) {
        const result = await service.issue(reference, grant);
        if (generation === useAuthStore.getState().generation) setAuthorization(result);
      }
      if (generation === useAuthStore.getState().generation) await client.invalidateQueries({ queryKey: ['privileged-recovery', generation] });
    } catch (failure) {
      if (failure instanceof Error && /cancelled|superseded|session_changed/.test(failure.message)) return;
      const status = isAxiosError(failure) ? failure.response?.status : undefined;
      const code: unknown = isAxiosError(failure) ? failure.response?.data?.code : undefined;
      setError(code === 'recovery_approval_expired' ? 'Las aprobaciones vencieron. Crea otra solicitud.' : status === 429 ? 'Espera un momento antes de reintentar.' : 'No se autorizó la operación. Revisa los requisitos y actualiza la lista.');
    } finally { setBusy(false); }
  };
  return { query, authorization, clearAuthorization: () => setAuthorization(null), busy, error, execute, stepUp };
}
