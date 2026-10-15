import { useEffect, useState } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionPayment } from '../types/subscription';
export function SubscriptionPaymentDetail({ payment }: { payment: SubscriptionPayment }) {
  const [image, setImage] = useState<string | null>(null); const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!payment.receiptUrl) return;
    const controller = new AbortController(); let url: string | undefined;
    subscriptionService.receipt(payment.receiptUrl, controller.signal).then(blob => {
      if (controller.signal.aborted) return; url = URL.createObjectURL(blob); setImage(url);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [payment.receiptUrl]);
  return <div className="space-y-3"><p className="font-bold">{payment.planName} · {payment.months} meses · {payment.amount.toFixed(2)} {payment.currency}</p>
    <p className="text-sm break-all">Referencia: {payment.reference}</p><p className="text-sm">{payment.statusLabel}</p>
    {payment.message && <p className="rounded-xl bg-base-200 p-3 text-sm">{payment.message}</p>}
    {image && <img src={image} alt="Comprobante de pago" className="max-h-96 max-w-full mx-auto object-contain rounded-xl" />}
    {failed && <p role="alert" className="text-xs text-error">No se pudo cargar el comprobante.</p>}
  </div>;
}
