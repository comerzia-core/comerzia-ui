import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu } from '../../../components/ui/ComerziaContextMenu';
import { usePlatformPage } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { useTenantAccountAssistance } from '../hooks/useTenantAccountAssistance';
import { TenantAccountAssistanceDialog, TenantAccountMenuItems } from './TenantAccountAssistance';

interface Account { id: string; fullName: string; username: string; statusLabel: string; locked: boolean; disabled: boolean; roles: string[]; }
export function TenantAccountTable({ companyId }: { companyId: string }) {
  const query = usePlatformPage<Account>('/saas/companies/' + encodeURIComponent(companyId) + '/users');
  const context = useSaasContextMenu<Account>();
  const assistance = useTenantAccountAssistance();
  return <div className="space-y-4">
    {query.isError && <p role="alert">No se pudieron consultar las cuentas.</p>}
    <ComerziaResponsiveTable data={query.data?.content ?? []} pagination={query.pagination} isLoading={query.isPending} onActions={context.open}
      columns={[{ header: 'Nombre', accessorKey: 'fullName' }, { header: 'Usuario', accessorKey: 'username' },
        { header: 'Estado', render: row => row.disabled ? 'Acceso bloqueado' : row.locked ? 'Bloqueado por intentos' : row.statusLabel },
        { header: 'Roles', render: row => row.roles.join(', ') }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}>
      <TenantAccountMenuItems account={context.menu.item ? { ...context.menu.item, companyId } : null}
        onSelect={operation => { if (context.menu.item) assistance.open({ ...context.menu.item, companyId }, operation); context.close(); }} />
    </ComerziaContextMenu>
    <TenantAccountAssistanceDialog assistance={assistance} />
  </div>;
}
