import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave, BtnAccess, BtnTab } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformData, usePlatformAction } from '../hooks/usePlatformData';
import { platformService } from '../services/platformService';
import { TenantAccountTable } from '../components/TenantAccountTable';
import { TenantSubscriptionPanel } from '../components/TenantSubscriptionPanel';
import { TenantBranchTable } from '../components/TenantBranchTable';
import type { SaasCompanyDetailResponse } from '../types/company';
export function SaasTenantPage() {
  const { id = '' } = useParams(); const base = '/saas/companies/' + encodeURIComponent(id);
  const query = usePlatformData<SaasCompanyDetailResponse>(base); const { can } = usePermission();
  const [tab, setTab] = useState('summary'); const [statusEditor, setStatusEditor] = useState(false); const [reason, setReason] = useState(''); const [shake, setShake] = useState(0);
  const status = usePlatformAction(() => platformService.patch(base + '/status', { active: !query.data!.status, reason }));
  if (query.isPending) return <p role="status">Cargando empresa…</p>;
  if (!query.data) return <p role="alert">No se pudo cargar la empresa.</p>;
  const company = query.data;
  return <div className="space-y-6"><div className="flex flex-col sm:flex-row justify-between gap-3"><div>
    <h1 className="text-2xl font-bold break-words">{company.commercialName}</h1><p className="text-sm text-base-content/60">{company.legalName} · NIT {company.taxId}</p>
    </div>{can('SYS_COMPANIES_MANAGE') && <BtnAccess disabledAccess={!company.status} responsive={false} label={company.status ? 'Suspender empresa' : 'Habilitar empresa'} onClick={() => { setReason(''); setShake(0); setStatusEditor(true); }} />}</div>
    <div className="flex gap-2 overflow-x-auto pb-1">
      <BtnTab responsive={false} label="Resumen" onClick={() => setTab('summary')} /><BtnTab responsive={false} label="Suscripción" onClick={() => setTab('subscription')} />
      <BtnTab responsive={false} label="Sucursales" onClick={() => setTab('branches')} />
      {can('SYS_TENANT_USERS_READ') && <BtnTab responsive={false} label="Usuarios" onClick={() => setTab('users')} />}
    </div>
    {tab === 'summary' && <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 space-y-3">
      <p>{company.status ? 'Empresa habilitada' : 'Empresa suspendida'}</p>
      <p>Zona horaria: {company.saasCompanySettingsResponse?.timezone ?? 'Sin configurar'}</p>
      <p>Moneda: {company.saasCompanySettingsResponse?.currencyCode ?? 'Sin configurar'}</p>
    </div>}
    {tab === 'subscription' && <TenantSubscriptionPanel companyId={id} />}
    {tab === 'branches' && <TenantBranchTable companyId={id} />}
    {tab === 'users' && can('SYS_TENANT_USERS_READ') && <TenantAccountTable companyId={id} />}
    <ComerziaModal isOpen={statusEditor} onClose={() => { if (!status.isPending) setStatusEditor(false); }} title={company.status ? 'Suspender empresa' : 'Habilitar empresa'}
      actions={<BtnSave responsive={false} label="Confirmar" isLoading={status.isPending} onClick={() => {
        if (!reason.trim()) { setShake(value => value + 1); return; }
        status.mutate(undefined, { onSuccess: () => setStatusEditor(false) });
      }} />}>
      <p className="text-sm mb-4">La suspensión bloquea la operación de la tienda y mantiene disponible la gestión de pagos.</p>
      <ComerziaInput label="Motivo" isRequired maxLength={500} value={reason} onChange={event => setReason(event.target.value)} shakeKey={shake} error={shake && !reason.trim() ? 'Indica el motivo.' : undefined} />
    </ComerziaModal>
  </div>;
}
