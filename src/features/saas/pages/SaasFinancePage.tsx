import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { SaasBillingHistoryPage } from './SaasBillingHistoryPage';
import { SaasBillingSettingsPage } from './SaasBillingSettingsPage';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformPage } from '../hooks/usePlatformData';
import { SubscriptionPaymentTable } from '../../organization/components/SubscriptionPaymentTable';
import { ReviewPaymentModal } from '../components/ReviewPaymentModal';
import type { SubscriptionPayment } from '../../organization/types/subscription';

export function SaasFinancePage({
  mode = 'verification',
}: {
  mode?: 'verification' | 'history' | 'settings';
}) {
  if (mode === 'history') return <SaasBillingHistoryPage />;
  if (mode === 'settings') return <SaasBillingSettingsPage />;
  return <SaasPaymentVerificationPage />;
}

function SaasPaymentVerificationPage() {
  const { can } = usePermission();
  const queue = usePlatformPage<SubscriptionPayment>('/saas/billing/requests', {
    status: 'PENDING',
  });
  const [selected, setSelected] = useState<SubscriptionPayment | null>(null);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Verificación de pagos QR
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Cola de solicitudes de suscripción pendientes de acreditación y verificación bancaria.
            </p>
          </div>
        </div>
      </div>

      {queue.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudieron consultar los pagos pendientes de revisión.</span>
        </div>
      )}

      {/* 2. TABLA DE COBROS PENDIENTES */}
      <SubscriptionPaymentTable
        showCompany
        data={queue.data?.content ?? []}
        pagination={queue.pagination}
        isLoading={queue.isPending}
        onDetail={setSelected}
      />

      {/* 3. MODAL DE REVISIÓN Y APROBACIÓN */}
      {selected && (
        <ReviewPaymentModal
          key={selected.id}
          payment={selected}
          canReview={can('SYS_FINANCE_MANAGE')}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
