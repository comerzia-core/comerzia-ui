import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useStepUp } from '../hooks/useStepUp';
import { MfaStepUpModal } from './MfaStepUpModal';
import { BtnSave } from '../../../components/ui/CrudButtons';
interface Readiness {
  webRehearsal: boolean; cliRehearsal: boolean; availableOfflineCodes: number;
  authorizedOperators: number; ownerApproved: boolean; blockers: string[];
}
export function MfaRecoveryReadinessPanel() {
  const generation = useAuthStore(state => state.generation);
  const isOwner = useAuthStore(state => state.userProfile?.roles.includes('SAAS_OWNER') ?? false);
  const queryClient = useQueryClient();
  const step = useStepUp();
  const path = '/saas/security/mfa/recovery-readiness';
  const query = useQuery({ queryKey: ['mfa-recovery-readiness', generation], queryFn: async () => (await api.get<Readiness>(path)).data });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const approve = async () => {
    setBusy(true); setError('');
    try {
      const grant = await step.requestStepUp('MANAGE_SAAS_TEAM', { targetId: 'POST:' + path + '/approve' });
      if (generation !== useAuthStore.getState().generation) return;
      await api.post(path + '/approve', null, { headers: { 'X-Mfa-Step-Up-Grant': grant } });
      await queryClient.invalidateQueries({ queryKey: ['mfa-recovery-readiness', generation] });
    } catch (failure) {
      if (failure instanceof Error && failure.message === 'step_up_cancelled') return;
      setError('No se pudo aprobar. Verifica que ambos ensayos estén completos.');
    }
    finally { setBusy(false); }
  };
  const data = query.data;
  return <section className="rounded-2xl bg-base-100 border border-base-200 p-4 space-y-3">
    <h2 className="font-semibold">Ensayos de recuperación</h2>
    {data ? <>
      <ul className="text-sm space-y-1">
        <li>Recuperación con dos aprobadores: {data.webRehearsal ? 'comprobada' : 'pendiente'}</li>
        <li>Recuperación mediante CLI: {data.cliRehearsal ? 'comprobada' : 'pendiente'}</li>
        <li>Operadores autorizados con 2FA: {data.authorizedOperators}</li>
        <li>Códigos offline disponibles: {data.availableOfflineCodes}</li>
        <li>Revisión del propietario: {data.ownerApproved ? 'registrada' : 'pendiente'}</li>
      </ul>
      {data.blockers.includes('two_independent_root_recovery_operators_required') && <p className="text-sm text-warning">ROOT necesita dos operadores autorizados distintos de su propia cuenta.</p>}
      {isOwner && !data.ownerApproved && <BtnSave label="Aprobar evidencias de recuperación" responsive={false} isLoading={busy}
        disabled={busy || data.blockers.some(blocker => blocker !== 'owner_recovery_evidence_approval_required')} onClick={() => void approve()} />}
      <p className="text-xs text-base-content/60">Las evidencias corresponden a este ambiente y vencen a los 30 días. La comprobación de infraestructura se realiza por separado.</p>
    </> : <p className="text-sm">{query.isError ? 'No se pudo consultar el estado.' : 'Consultando…'}</p>}
    {error && <p role="alert" className="text-error text-sm">{error}</p>}
    <MfaStepUpModal isOpen={step.isStepUpOpen} action={step.stepUpAction} targetId={step.stepUpTarget} onSuccess={step.handleSuccess} onCancel={step.handleCancel} />
  </section>;
}
