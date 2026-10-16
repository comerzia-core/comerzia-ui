import { useState } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { usePlatformAction } from '../hooks/usePlatformData';
import { subscriptionService } from '../../organization/services/subscriptionService';
import type { BillingSettings } from '../../organization/types/subscription';
export function BillingSettingsModal({ value, onClose }: { value: BillingSettings; onClose: () => void }) {
  const [receiverName, setReceiverName] = useState(value.receiverName); const [instructions, setInstructions] = useState(value.instructions ?? '');
  const [bankName, setBankName] = useState(value.bankName ?? ''); const [accountNumber, setAccountNumber] = useState(value.accountNumber ?? '');
  const [qr, setQr] = useState<File | null>(null); const [shake, setShake] = useState(0);
  const save = usePlatformAction(() => subscriptionService.saveSettings({ receiverName, instructions, bankName, accountNumber }, qr));
  return <ComerziaModal isOpen onClose={() => { if (!save.isPending) onClose(); }} title="QR de cobro Comerzia"
    actions={<BtnSave responsive={false} isLoading={save.isPending} onClick={() => {
      if (!receiverName.trim()) { setShake(value => value + 1); return; }
      save.mutate(undefined, { onSuccess: onClose });
    }} />}>
    <div className="space-y-4"><ComerziaInput label="Titular receptor" isRequired maxLength={150} value={receiverName} shakeKey={shake}
      error={shake && !receiverName.trim() ? 'Indica el titular.' : undefined} onChange={event => setReceiverName(event.target.value)} />
      <ComerziaInput label="Banco" maxLength={100} value={bankName} onChange={event => setBankName(event.target.value)} />
      <ComerziaInput label="Cuenta bancaria" maxLength={100} value={accountNumber} onChange={event => setAccountNumber(event.target.value)} />
      <ComerziaInput label="Indicaciones de pago" maxLength={500} value={instructions} onChange={event => setInstructions(event.target.value)} />
      <ComerziaInput type="file" label="Nuevo QR" accept="image/png,image/jpeg" onChange={event => setQr(event.target.files?.[0] ?? null)} />
      {value.qrUrl && <img src={value.qrUrl} alt="QR actual de Comerzia" className="w-full max-h-56 object-contain" />}
      <p className="text-xs text-base-content/60">Moneda de cobro: {value.currency}. Este QR se comparte con los tenants al pagar.</p>
    </div>
  </ComerziaModal>;
}
