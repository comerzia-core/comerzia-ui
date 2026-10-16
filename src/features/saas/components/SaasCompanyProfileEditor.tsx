import { useState } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { usePlatformAction } from '../hooks/usePlatformData';
import { platformService } from '../services/platformService';
import type { SaasCompanyDetailResponse } from '../types/company';
export function SaasCompanyProfileEditor({ company, onClose }: { company: SaasCompanyDetailResponse; onClose: () => void }) {
  const [form, setForm] = useState({ commercialName: company.commercialName, legalName: company.legalName ?? '', taxId: company.taxId ?? '', email: company.email ?? '', phoneNumber: company.phoneNumber ?? '', address: company.address ?? '' });
  const [shake, setShake] = useState(0); const save = usePlatformAction(() => platformService.put('/saas/companies/' + encodeURIComponent(company.id) + '/profile', form));
  const fields = [{ key: 'commercialName', label: 'Nombre comercial', max: 150 }, { key: 'legalName', label: 'Razón social', max: 150 }, { key: 'taxId', label: 'NIT', max: 50 }, { key: 'email', label: 'Correo', max: 100 }, { key: 'phoneNumber', label: 'Teléfono', max: 15 }, { key: 'address', label: 'Dirección', max: 250 }] as const;
  return <ComerziaModal isOpen onClose={() => { if (!save.isPending) onClose(); }} title="Información de la empresa"
    actions={<BtnSave responsive={false} isLoading={save.isPending} onClick={() => { if (!form.commercialName.trim()) { setShake(value => value + 1); return; } save.mutate(undefined, { onSuccess: onClose }); }} />}>
    <div className="space-y-4">{fields.map(field => <ComerziaInput key={field.key} label={field.label} aria-label={field.label} value={form[field.key]} maxLength={field.max} isRequired={field.key === 'commercialName'} type={field.key === 'email' ? 'email' : 'text'} shakeKey={shake}
      error={shake && field.key === 'commercialName' && !form.commercialName.trim() ? 'Indica el nombre.' : undefined} onChange={e => setForm(value => ({ ...value, [field.key]: e.target.value }))} />)}</div>
  </ComerziaModal>;
}
