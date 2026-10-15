import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { useState } from 'react';
import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnDetails } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { usePlatformData, usePlatformPage } from '../hooks/usePlatformData';
import { SubscriptionPaymentTable } from '../../organization/components/SubscriptionPaymentTable';
import { ReviewPaymentModal } from '../components/ReviewPaymentModal';
import { BillingSettingsModal } from '../components/BillingSettingsModal';
import type { SubscriptionPayment, FinanceSummary, BillingSettings } from '../../organization/types/subscription';
export function SaasFinancePage() {
  const { can } = usePermission(); const summary = usePlatformData<FinanceSummary>('/saas/finances');
  const settings = usePlatformData<BillingSettings>('/saas/billing/settings'); const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState(''); const queue = usePlatformPage<SubscriptionPayment>('/saas/billing/requests', { status: status || undefined });
  const { options } = useLoadDictionaries([DICTIONARIES.SUBSCRIPTION_PAYMENT_STATUS]); const [selected, setSelected] = useState<SubscriptionPayment | null>(null);
  return <div className="space-y-6"><div className="flex flex-col sm:flex-row justify-between gap-3"><h1 className="text-2xl font-bold">Finanzas de Comerzia</h1>
    {can('SYS_BILLING_SETTINGS_MANAGE') && settings.data && <BtnDetails responsive={false} label="Configurar QR de cobro" onClick={() => setShowSettings(true)} />}</div>
    {(summary.isError || queue.isError) && <p role="alert">No se pudieron consultar los datos financieros.</p>}
    {summary.data && <><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <ComerziaMetricCard label="Recaudado este mes (UTC)" value={summary.data.collectedThisMonth.toFixed(2) + ' Bs'} />
      <ComerziaMetricCard label="Recaudación acumulada" value={summary.data.totalCollected.toFixed(2) + ' Bs'} />
      <ComerziaMetricCard label="MRR · ingreso recurrente contratado" value={summary.data.mrr.toFixed(2) + ' Bs'} />
      <ComerziaMetricCard label="ARR · proyección anual" value={summary.data.arr.toFixed(2) + ' Bs'} />
    </div><p className="text-sm">{summary.data.pendingReviews} pagos pendientes de revisión</p></>}
    {!settings.data?.qrUrl && settings.isSuccess && <p className="text-warning text-sm">Configura el QR para que los clientes puedan solicitar pagos.</p>}
    <ComerziaSurface className="">
      <ComerziaSelect label="Estado" options={options[DICTIONARIES.SUBSCRIPTION_PAYMENT_STATUS] ?? []} value={status} enableDefaultOption placeholder="Todos"
        onChange={event => { setStatus(event.target.value); queue.pagination.onPageChange(0); }} />
    </ComerziaSurface>
    <SubscriptionPaymentTable showCompany data={queue.data?.content ?? []} pagination={queue.pagination} isLoading={queue.isPending} onDetail={setSelected} />
    {selected && <ReviewPaymentModal key={selected.id} payment={selected} canReview={can('SYS_FINANCE_MANAGE')} onClose={() => setSelected(null)} />}
    {showSettings && settings.data && <BillingSettingsModal value={settings.data} onClose={() => setShowSettings(false)} />}
  </div>;
}
