import { Eye } from 'lucide-react';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import type { TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { useSaasContextMenu } from '../../saas/hooks/useSaasContextMenu';
import { formatDateForUser } from '../../../utils/date';
import type { SubscriptionPayment } from '../types/subscription';

interface Props { data: SubscriptionPayment[]; pagination: TablePaginationConfig; isLoading: boolean; showCompany?: boolean; onDetail: (value: SubscriptionPayment) => void; }
export function SubscriptionPaymentTable({ data, pagination, isLoading, showCompany, onDetail }: Props) {
  const context = useSaasContextMenu<SubscriptionPayment>();
  return <><ComerziaResponsiveTable data={data} pagination={pagination} isLoading={isLoading} onActions={context.open}
    columns={[...(showCompany ? [{ header: 'Empresa', accessorKey: 'companyName' as const }] : []),
      { header: 'Fecha', render: row => formatDateForUser(row.requestedAt) }, { header: 'Plan', accessorKey: 'planName' },
      { header: 'Meses', accessorKey: 'months' }, { header: 'Importe', render: row => row.amount.toFixed(2) + ' ' + row.currency },
      { header: 'Estado', accessorKey: 'statusLabel' }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}><ContextMenuItem icon={Eye} label="Ver solicitud"
      onClick={() => { if (context.menu.item) onDetail(context.menu.item); context.close(); }} /></ComerziaContextMenu>
  </>;
}
