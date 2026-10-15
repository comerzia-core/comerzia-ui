import { useState } from 'react';
import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnDetails, BtnSave, BtnCancel } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformData, usePlatformPage, usePlatformAction } from '../../saas/hooks/usePlatformData';
import { platformService, platformError } from '../../saas/services/platformService';
import { useSubscriptionCheckout } from '../hooks/useSubscriptionCheckout';
import { SubscriptionPaymentTable } from '../components/SubscriptionPaymentTable';
import { SubscriptionPaymentDetail } from '../components/SubscriptionPaymentDetail';
import type { SubscriptionAccess, SubscriptionPlan, SubscriptionPayment } from '../types/subscription';
import { formatDateForUser } from '../../../utils/date';
export function SubscriptionPage() {
  const { can } = usePermission(); const canRead = can('ORG_SUBSCRIPTIONS_READ'); const canPay = can('ORG_BILLING_MANAGE');
  const access = usePlatformData<SubscriptionAccess>('/tenant/billing/access');
  const plans = usePlatformData<SubscriptionPlan[]>('/tenant/subscriptions/plans', undefined, canRead);
  const history = usePlatformPage<SubscriptionPayment>('/tenant/billing/requests', undefined, canRead);
  const checkout = useSubscriptionCheckout(); const [detail, setDetail] = useState<SubscriptionPayment | null>(null); const [confirmFree, setConfirmFree] = useState(false);
  const cancel = usePlatformAction((value: SubscriptionPayment) => platformService.post('/tenant/billing/requests/' + encodeURIComponent(value.id) + '/cancel'));
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Suscripción y pagos</h1>
    {access.isError && <p role="alert">No se pudo consultar la suscripción.</p>}
    {access.data && <><p>{access.data.planName ?? 'Sin plan'} · {access.data.operational ? 'Disponible' : 'Requiere atención'}
      {access.data.validUntil && ' · Hasta ' + formatDateForUser(access.data.validUntil)}</p>
      {!access.data.companyActive && <p className="text-warning text-sm">La empresa está suspendida. Contacta con soporte.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><ComerziaMetricCard label="Sucursales" value={access.data.branches + ' / ' + (access.data.unlimited ? 'Sin límite' : access.data.maxBranches)} />
      <ComerziaMetricCard label="Usuarios" value={access.data.users + ' / ' + (access.data.unlimited ? 'Sin límite' : access.data.maxUsers)} />
      <ComerziaMetricCard label="Productos" value={access.data.products + ' / ' + (access.data.unlimited ? 'Sin límite' : access.data.maxProducts)} /></div></>}
    {!canRead && <p className="text-sm">Contacta con el propietario para revisar o renovar el plan.</p>}
    {canRead && <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{plans.data?.map(plan => <div key={plan.id} className="card bg-base-100 p-4 rounded-2xl border border-base-200 space-y-3">
      <h2 className="font-bold">{plan.name}</h2><p>{plan.monthlyPrice.toFixed(2)} Bs/mes</p><p className="text-xs text-base-content/60">{plan.baseMaxBranches} sucursales · {plan.baseMaxUsers} usuarios · {plan.baseMaxProducts} productos</p>
      {canPay && !access.data?.unlimited && (plan.monthlyPrice > 0 ? <BtnDetails responsive={false} label="Pagar por QR" onClick={() => checkout.choose(plan.code)} /> : <BtnDetails responsive={false} label="Activar Free" onClick={() => setConfirmFree(true)} />)}
    </div>)}</div>}
    {canRead && <><h2 className="text-lg font-bold">Solicitudes de pago</h2>
      {history.isError && <p role="alert">No se pudo consultar el historial.</p>}
      <SubscriptionPaymentTable data={history.data?.content ?? []} pagination={history.pagination} isLoading={history.isPending} onDetail={setDetail} /></>}
    <ComerziaModal isOpen={checkout.plan !== null} onClose={checkout.close} title="Pago por QR" actions={
      <BtnSave responsive={false} label="Enviar a revisión" isLoading={checkout.submit.isPending} disabled={!checkout.quote.data || checkout.quote.isFetching} onClick={checkout.send} />}>
      <div className="space-y-4"><ComerziaInput label="Meses" type="number" min={1} max={12} value={checkout.months} shakeKey={checkout.shake}
        onChange={event => checkout.setMonths(Number(event.target.value))} />
        {checkout.quote.isFetching && <p role="status">Consultando importe…</p>}
        {checkout.quote.isError && <p role="alert" className="text-sm text-error">{platformError(checkout.quote.error)}</p>}
        {checkout.quote.data && <><p className="font-bold">{checkout.quote.data.planName} · {checkout.quote.data.amount.toFixed(2)} {checkout.quote.data.currency}</p>
          <img src={checkout.quote.data.qrUrl} alt="QR de pago a Comerzia" className="max-h-64 w-full object-contain bg-white rounded-xl" />
          <p className="text-sm">{checkout.quote.data.receiverName}</p><p className="text-xs text-base-content/60">{checkout.quote.data.instructions}</p>
          <p className="text-xs">{checkout.quote.data.validityRule}</p></>}
        <ComerziaInput aria-label="Referencia de la transferencia" label="Referencia de la transferencia" isRequired value={checkout.reference} maxLength={150} shakeKey={checkout.shake}
          error={checkout.shake && !checkout.reference.trim() ? 'Indica la referencia.' : undefined} onChange={event => checkout.setReference(event.target.value)} />
        <ComerziaInput label="Comprobante (opcional)" type="file" accept="image/jpeg,image/png" onChange={event => checkout.setReceipt(event.target.files?.[0] ?? null)} />
        <p className="text-xs text-base-content/60">La suscripción cambia después de verificar el pago.</p>
      </div>
    </ComerziaModal>
    <ComerziaModal isOpen={!!detail} onClose={() => { if (!cancel.isPending) setDetail(null); }} title="Solicitud de pago"
      actions={canPay && detail?.pending ? <BtnCancel responsive={false} label="Cancelar solicitud" isLoading={cancel.isPending} onClick={() => { if (detail) cancel.mutate(detail, { onSuccess: () => setDetail(null) }); }} /> : undefined}>
      {detail && <SubscriptionPaymentDetail key={detail.id} payment={detail} />}
    </ComerziaModal>
    <ComerziaModal isOpen={confirmFree} onClose={() => setConfirmFree(false)} title="Activar plan gratuito"
      actions={<BtnSave responsive={false} label="Activar Free" isLoading={checkout.free.isPending} onClick={() => checkout.free.mutate(undefined, { onSuccess: () => setConfirmFree(false) })} />}>
      Se verificarán los límites del plan. Un plan pagado debe haber vencido.
    </ComerziaModal>
  </div>;
}
