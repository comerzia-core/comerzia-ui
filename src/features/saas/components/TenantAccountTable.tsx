import { useState } from 'react';
import { KeyRound, Unlock } from 'lucide-react';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import { TemporaryCredentialsModal } from './TemporaryCredentialsModal';
import type { TemporaryCredentials } from '../types/platform';
interface Account { id: string; fullName: string; username: string; statusLabel: string; locked: boolean; disabled: boolean; roles: string[]; }
export function TenantAccountTable({ companyId }: { companyId: string }) {
  const path = '/saas/companies/' + encodeURIComponent(companyId) + '/users';
  const query = usePlatformPage<Account>(path); const context = useSaasContextMenu<Account>(); const { can } = usePermission();
  const [confirmation, setConfirmation] = useState<{ row: Account; action: 'unlock' | 'reset-password' } | null>(null);
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);
  const action = usePlatformAction(() => platformService.post<TemporaryCredentials | undefined>(path + '/' + encodeURIComponent(confirmation!.row.id) + '/' + confirmation!.action));
  return <div className="space-y-4">
    {query.isError && <p role="alert">No se pudieron consultar las cuentas.</p>}
    <ComerziaResponsiveTable data={query.data?.content ?? []} pagination={query.pagination} isLoading={query.isPending} onActions={context.open}
      columns={[{ header: 'Nombre', accessorKey: 'fullName' }, { header: 'Usuario', accessorKey: 'username' }, { header: 'Estado', accessorKey: 'statusLabel' },
        { header: 'Roles', render: row => row.roles.join(', ') }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}>
      {can('SYS_TENANT_USERS_SUPPORT') && <>
        {context.menu.item?.locked && <ContextMenuItem icon={Unlock} label="Desbloquear cuenta" onClick={() => { if (context.menu.item) setConfirmation({ row: context.menu.item, action: 'unlock' }); context.close(); }} />}
        <ContextMenuItem icon={KeyRound} label="Restablecer contraseña" onClick={() => { if (context.menu.item) setConfirmation({ row: context.menu.item, action: 'reset-password' }); context.close(); }} />
      </>}
    </ComerziaContextMenu>
    <ComerziaModal isOpen={!!confirmation} onClose={() => { if (!action.isPending) setConfirmation(null); }} title="Confirmar asistencia de acceso" size="sm"
      actions={<BtnSave responsive={false} label="Confirmar" isLoading={action.isPending} onClick={() => action.mutate(undefined, { onSuccess: result => {
        if (result?.temporaryPassword) setCredentials(result); setConfirmation(null);
      } })} />}>
      {confirmation?.row.fullName ?? confirmation?.row.username}. {confirmation?.action === 'reset-password' ? 'Se invalidarán las sesiones y se generará una contraseña temporal.' : 'Se limpiará el bloqueo por intentos fallidos.'}
    </ComerziaModal><TemporaryCredentialsModal value={credentials} onClose={() => setCredentials(null)} />
  </div>;
}
