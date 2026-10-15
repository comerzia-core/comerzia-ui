import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArchiveRestore } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import type { RecoveryRecord } from '../types/platform';
import { formatDateForUser } from '../../../utils/date';
export function SaasRecoveryPage() {
  const { companyId } = useParams(); const [entity, setEntity] = useState(''); const [selected, setSelected] = useState<RecoveryRecord | null>(null);
  const [reason, setReason] = useState(''); const [shake, setShake] = useState(0);
  const { options } = useLoadDictionaries([DICTIONARIES.RECOVERY_ENTITY]);
  const path = '/saas/companies/' + encodeURIComponent(companyId ?? '') + '/recovery';
  const query = usePlatformPage<RecoveryRecord>(path, { entity }, !!companyId && !!entity);
  const context = useSaasContextMenu<RecoveryRecord>();
  const restore = usePlatformAction(() => platformService.post(path + '/' + encodeURIComponent(selected!.id) + '/restore?entity=' + encodeURIComponent(entity), { reason }));
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Registros eliminados</h1>
    <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200"><ComerziaSelect label="Tipo de registro" options={options[DICTIONARIES.RECOVERY_ENTITY] ?? []}
      value={entity} onChange={event => { setEntity(event.target.value); query.pagination.onPageChange(0); }} /></div>
    {query.isError && <p role="alert">No se pudieron consultar los registros.</p>}
    {entity && <ComerziaResponsiveTable data={query.data?.content ?? []} pagination={query.pagination} isLoading={query.isPending} onActions={context.open}
      columns={[{ header: 'Nombre', accessorKey: 'name' }, { header: 'Eliminación', render: row => formatDateForUser(row.removedAt) }, { header: 'Responsable', accessorKey: 'removedBy' }]} />}
    <ComerziaContextMenu {...context.menu} onClose={context.close}><ContextMenuItem icon={ArchiveRestore} label="Restaurar" onClick={() => { setReason(''); setSelected(context.menu.item); context.close(); }} /></ComerziaContextMenu>
    <ComerziaModal isOpen={!!selected} onClose={() => { if (!restore.isPending) setSelected(null); }} title="Restaurar registro"
      actions={<BtnSave responsive={false} label="Restaurar" isLoading={restore.isPending} onClick={() => {
        if (!reason.trim()) { setShake(value => value + 1); return; }
        restore.mutate(undefined, { onSuccess: () => setSelected(null) });
      }} />}>
      <p className="text-sm mb-4">{selected?.name}. Se comprobarán dependencias y duplicados.</p>
      <ComerziaInput label="Motivo" isRequired value={reason} maxLength={500} shakeKey={shake} error={shake && !reason.trim() ? 'Indica el motivo.' : undefined} onChange={event => setReason(event.target.value)} />
    </ComerziaModal>
  </div>;
}
