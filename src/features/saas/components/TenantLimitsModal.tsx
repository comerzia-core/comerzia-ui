import { useState } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { usePlatformAction } from '../hooks/usePlatformData';
import { platformService } from '../services/platformService';
import type { SubscriptionAccess } from '../../organization/types/subscription';
export function TenantLimitsModal({ companyId, access, onClose }: { companyId: string; access: SubscriptionAccess; onClose: () => void }) {
  const [extraBranches, setExtraBranches] = useState(access.extraBranches ?? 0); const [extraUsers, setExtraUsers] = useState(access.extraUsers ?? 0);
  const [reason, setReason] = useState(''); const [shake, setShake] = useState(0);
  const save = usePlatformAction(() => platformService.put('/saas/companies/' + encodeURIComponent(companyId) + '/subscriptions/limits', { extraBranches, extraUsers, reason }));
  return <ComerziaModal isOpen onClose={() => { if (!save.isPending) onClose(); }} title="Recursos adicionales"
    actions={<BtnSave responsive={false} isLoading={save.isPending} onClick={() => {
      if (!reason.trim() || extraBranches < 0 || extraUsers < 0) { setShake(value => value + 1); return; }
      save.mutate(undefined, { onSuccess: onClose });
    }} />}>
    <div className="space-y-4"><ComerziaInput label="Sucursales adicionales" type="number" min={0} step={1} value={extraBranches} onChange={event => setExtraBranches(Number(event.target.value))} />
      <ComerziaInput label="Usuarios adicionales" type="number" min={0} step={1} value={extraUsers} onChange={event => setExtraUsers(Number(event.target.value))} />
      <ComerziaInput label="Motivo" isRequired maxLength={500} value={reason} shakeKey={shake} error={shake && !reason.trim() ? 'Indica el motivo.' : undefined} onChange={event => setReason(event.target.value)} />
    </div>
  </ComerziaModal>;
}
