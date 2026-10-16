import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useSaasStaffEditor } from '../hooks/useSaasStaffEditor';
import { SaasStaffPhoto } from './SaasStaffPhoto';
export function SaasStaffEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const editor = useSaasStaffEditor(id, onClose); const { form, update, person, shake, errors } = editor;
  const { options, isLoading } = useLoadDictionaries([DICTIONARIES.DOCUMENT_TYPE, DICTIONARIES.DOCUMENT_EXTENSION, DICTIONARIES.PAYMENT_FREQUENCY]);
  return <ComerziaModal isOpen onClose={() => { if (!editor.save.isPending) onClose(); }} title={id ? 'Editar colaborador' : 'Nuevo colaborador'} size="lg"
    actions={<BtnSave responsive={false} disabled={!!id && !editor.detail.isSuccess} isLoading={editor.save.isPending} onClick={editor.submit} />}>
    {editor.detail.isError && <p role="alert">No se pudo cargar el colaborador.</p>}
    {id && editor.detail.data && <SaasStaffPhoto id={id} imageUrl={editor.detail.data.imageUrl} />}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ComerziaInput label="Nombres" aria-label="Nombres" isRequired value={form.person.firstName} maxLength={100} shakeKey={shake} error={errors.firstName} onChange={e => person('firstName', e.target.value)} />
      <ComerziaInput label="Apellido paterno" aria-label="Apellido paterno" value={form.person.paternalSurname} maxLength={45} shakeKey={shake} error={errors.paternalSurname} onChange={e => person('paternalSurname', e.target.value)} />
      <ComerziaInput label="Apellido materno" aria-label="Apellido materno" value={form.person.maternalSurname} maxLength={45} onChange={e => person('maternalSurname', e.target.value)} />
      <ComerziaInput label="Correo" aria-label="Correo" type="email" value={form.person.email} maxLength={100} shakeKey={shake} error={errors.email} onChange={e => person('email', e.target.value)} />
      <ComerziaInput label="Teléfono" aria-label="Teléfono" value={form.person.phoneNumber} maxLength={15} onChange={e => person('phoneNumber', e.target.value)} />
      <ComerziaSelect label="Tipo de documento" aria-label="Tipo de documento" value={form.person.documentType ?? ''} options={options[DICTIONARIES.DOCUMENT_TYPE] ?? []} isLoading={isLoading} enableDefaultOption placeholder="Sin documento" onChange={e => person('documentType', e.target.value ? Number(e.target.value) : null)} />
      <ComerziaInput label="Documento" aria-label="Documento" value={form.person.documentNumber} maxLength={20} shakeKey={shake} error={errors.documentNumber} onChange={e => person('documentNumber', e.target.value)} />
      <ComerziaSelect label="Extensión" aria-label="Extensión" value={form.person.extension ?? ''} options={options[DICTIONARIES.DOCUMENT_EXTENSION] ?? []} enableDefaultOption placeholder="Sin extensión" onChange={e => person('extension', e.target.value ? Number(e.target.value) : null)} />
      <ComerziaInput label="Cargo" aria-label="Cargo" value={form.jobTitle} maxLength={100} onChange={e => update('jobTitle', e.target.value)} />
      <ComerziaInput label="Dirección" aria-label="Dirección" value={form.address} maxLength={250} onChange={e => update('address', e.target.value)} />
      <ComerziaInput label="Fecha de ingreso" aria-label="Fecha de ingreso" type="date" value={form.employmentStartDate} onChange={e => update('employmentStartDate', e.target.value)} />
      <ComerziaInput label="Fecha de retiro" aria-label="Fecha de retiro" type="date" value={form.employmentEndDate} onChange={e => update('employmentEndDate', e.target.value)} />
      <ComerziaInput label="Salario base (Bs)" aria-label="Salario base (Bs)" type="number" min={0} step="0.01" value={form.baseSalary} onChange={e => update('baseSalary', e.target.value)} />
      <ComerziaSelect label="Frecuencia de pago" aria-label="Frecuencia de pago" value={form.paymentFrequency} options={options[DICTIONARIES.PAYMENT_FREQUENCY] ?? []} enableDefaultOption placeholder="Sin definir" onChange={e => update('paymentFrequency', e.target.value)} />
      <ComerziaCheckbox label="Colaborador activo" checked={form.active} onChange={value => update('active', value)} />
    </div>
  </ComerziaModal>;
}
