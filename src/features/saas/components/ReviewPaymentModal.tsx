import { useState } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { BtnSave, BtnCancel } from '../../../components/ui/CrudButtons';
import { SubscriptionPaymentDetail } from '../../organization/components/SubscriptionPaymentDetail';
import { usePlatformAction } from '../hooks/usePlatformData';
import { platformService } from '../services/platformService';
import type { SubscriptionPayment } from '../../organization/types/subscription';
export function ReviewPaymentModal({ payment, canReview, onClose }: { payment: SubscriptionPayment; canReview: boolean; onClose: () => void }) {
  const [message, setMessage] = useState(''); const [received, setReceived] = useState(String(payment.amount)); const [verified, setVerified] = useState(false); const [shake, setShake] = useState(0);
  const review = usePlatformAction((approved: boolean) => platformService.post('/saas/billing/requests/' + encodeURIComponent(payment.id) + '/review',
    { approved, message, receivedAmount: Number(received), bankVerified: verified }));
  const send = (approved: boolean) => {
    if ((!approved && !message.trim()) || (approved && (!verified || !received))) { setShake(value => value + 1); return; }
    review.mutate(approved, { onSuccess: onClose });
  };
  return <ComerziaModal isOpen onClose={() => { if (!review.isPending) onClose(); }} title={'Pago de ' + payment.companyName}
    actions={canReview && payment.pending ? <div className="flex flex-wrap gap-3">
      <BtnCancel responsive={false} label="Rechazar" disabled={review.isPending} onClick={() => send(false)} /><BtnSave responsive={false} label="Aprobar" isLoading={review.isPending} onClick={() => send(true)} />
    </div> : undefined}>
    <SubscriptionPaymentDetail payment={payment} />
    {canReview && payment.pending && <div className="space-y-4 mt-5">
      <ComerziaInput label="Importe recibido en el banco" type="number" step="0.01" min="0.01" value={received} onChange={event => setReceived(event.target.value)} />
      <ComerziaCheckbox label="Verifiqué esta transferencia en la cuenta bancaria" checked={verified} onChange={setVerified} />
      {shake > 0 && !verified && <p className="text-xs text-warning">Para aprobar, verifica el abono en el banco.</p>}
      <ComerziaInput label="Mensaje al cliente" helperText="Obligatorio al rechazar. Al aprobar puede dejarse vacío." value={message} maxLength={500}
        shakeKey={shake} onChange={event => setMessage(event.target.value)} />
    </div>}
  </ComerziaModal>;
}
