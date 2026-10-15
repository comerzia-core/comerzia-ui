import { TenantLimitsModal } from './TenantLimitsModal';
import { useState } from 'react';
import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { BtnDetails, BtnSave } from '../../../components/ui/CrudButtons';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { usePermission } from '../../../hooks/usePermission';
import { DICTIONARIES } from '../../../config/dictionaries';
import { usePlatformData, usePlatformAction } from '../hooks/usePlatformData';
import { platformService } from '../services/platformService';
import { formatDateForUser } from '../../../utils/date';
import type { SubscriptionAccess } from '../../organization/types/subscription';
export function TenantSubscriptionPanel({ companyId }: { companyId: string }) {
  const base = '/saas/companies/' + encodeURIComponent(companyId); const query = usePlatformData<SubscriptionAccess>(base + '/subscription-access');
  const { can } = usePermission(); const { options } = useLoadDictionaries([DICTIONARIES.PLAN_TYPE]); const [editor, setEditor] = useState(false); const [limits, setLimits] = useState(false);
  const [plan, setPlan] = useState(''); const [months, setMonths] = useState(1); const [reason, setReason] = useState(''); const [shake, setShake] = useState(0);
  const grant = usePlatformAction(() => platformService.post(base + '/subscription-grants', { planTypeCode: Number(plan), months, reason }));
  return <div className="space-y-4">{query.isError && <p role="alert">No se pudo consultar el plan.</p>}
    {query.data && <><p className="font-bold">{query.data.planName ?? 'Sin plan'} · {query.data.validUntil ? 'Hasta ' + formatDateForUser(query.data.validUntil) : 'Sin vencimiento'}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><ComerziaMetricCard label="Sucursales" value={query.data.branches + ' / ' + (query.data.unlimited ? 'Sin límite' : query.data.maxBranches)} />
      <ComerziaMetricCard label="Usuarios" value={query.data.users + ' / ' + (query.data.unlimited ? 'Sin límite' : query.data.maxUsers)} />
      <ComerziaMetricCard label="Productos" value={query.data.products + ' / ' + (query.data.unlimited ? 'Sin límite' : query.data.maxProducts)} /></div></>}
    {can('SYS_BILLING_MANAGE') && <BtnDetails responsive={false} label="Asignar o bonificar plan" onClick={() => { setEditor(true); setReason(''); setPlan(''); }} />}
    {can('SYS_BILLING_MANAGE') && query.data && !query.data.unlimited && <BtnDetails responsive={false} label="Modificar recursos" onClick={() => setLimits(true)} />}
    {limits && query.data && <TenantLimitsModal companyId={companyId} access={query.data} onClose={() => setLimits(false)} />}
    <ComerziaModal isOpen={editor} onClose={() => { if (!grant.isPending) setEditor(false); }} title="Asignación manual de plan"
      actions={<BtnSave responsive={false} isLoading={grant.isPending} onClick={() => {
        if (!plan || !reason.trim() || months < 1 || months > 120) { setShake(value => value + 1); return; }
        grant.mutate(undefined, { onSuccess: () => setEditor(false) });
      }} />}>
      <div className="space-y-4"><p className="text-xs text-base-content/60">Esta asignación no registra una transferencia bancaria.</p>
        <ComerziaSelect label="Plan" options={options[DICTIONARIES.PLAN_TYPE] ?? []} value={plan} onChange={event => setPlan(event.target.value)} shakeKey={shake} error={shake && !plan ? 'Selecciona un plan.' : undefined} isRequired />
        <ComerziaInput label="Meses (solo planes con vencimiento)" type="number" min={1} max={120} value={months} onChange={event => setMonths(Number(event.target.value))} />
        <ComerziaInput label="Motivo" isRequired value={reason} maxLength={500} onChange={event => setReason(event.target.value)} shakeKey={shake} error={shake && !reason.trim() ? 'Indica el motivo.' : undefined} />
      </div>
    </ComerziaModal>
  </div>;
}
