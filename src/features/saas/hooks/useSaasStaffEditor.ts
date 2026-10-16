import { useState } from 'react';
import { usePlatformAction, usePlatformData } from './usePlatformData';
import { platformService } from '../services/platformService';
import type { SaasStaffDetails, SaasStaffForm, StaffPerson } from '../types/staff';
export function useSaasStaffEditor(id: string | null, onClose: () => void) {
  const detail = usePlatformData<SaasStaffDetails>('/saas/team/members/' + encodeURIComponent(id ?? ''), undefined, !!id);
  const [draft, setDraft] = useState<SaasStaffForm | null>(null);
  const [shake, setShake] = useState(0);
  const source = detail.data;
  const form: SaasStaffForm = draft ?? { person: { firstName: source?.person.firstName ?? '', paternalSurname: source?.person.paternalSurname ?? '', maternalSurname: source?.person.maternalSurname ?? '',
    email: source?.person.email ?? '', phoneNumber: source?.person.phoneNumber ?? '', documentNumber: source?.person.documentNumber ?? '', documentType: source?.person.documentType ?? null, extension: source?.person.extension ?? null },
    jobTitle: source?.jobTitle ?? '', address: source?.address ?? '', employmentStartDate: source?.employmentStartDate ?? '', employmentEndDate: source?.employmentEndDate ?? '', baseSalary: source?.baseSalary?.toString() ?? '', paymentFrequency: source?.paymentFrequency?.toString() ?? '', active: source?.active ?? true };
  const update = <K extends keyof SaasStaffForm>(key: K, value: SaasStaffForm[K]) => setDraft({ ...form, [key]: value });
  const person = <K extends keyof StaffPerson>(key: K, value: StaffPerson[K]) => update('person', { ...form.person, [key]: value });
  const errors: Record<string, string> = {};
  if (!form.person.firstName.trim()) errors.firstName = 'Indica los nombres.';
  if (!form.person.paternalSurname.trim() && !form.person.maternalSurname.trim()) errors.paternalSurname = 'Indica al menos un apellido.';
  if (form.person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.person.email)) errors.email = 'Correo inválido.';
  if (!!form.person.documentNumber !== !!form.person.documentType) errors.documentNumber = 'Completa tipo y número de documento.';
  const save = usePlatformAction(() => {
    const payload = { ...form, employmentStartDate: form.employmentStartDate || null, employmentEndDate: form.employmentEndDate || null, baseSalary: form.baseSalary === '' ? null : Number(form.baseSalary), paymentFrequency: form.paymentFrequency ? Number(form.paymentFrequency) : null };
    return id ? platformService.put('/saas/team/members/' + encodeURIComponent(id), payload) : platformService.post('/saas/team/members', payload);
  });
  const submit = () => { if (Object.keys(errors).length) { setShake(value => value + 1); return; } save.mutate(undefined, { onSuccess: onClose }); };
  return { form, update, person, errors: shake ? errors : {}, shake, save, submit, detail };
}
