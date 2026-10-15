import { useState } from 'react';
import { Eye } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { usePlatformPage } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import type { PlatformAudit } from '../types/platform';
import { formatDateForUser } from '../../../utils/date';
export function SaasAuditPage() {
  const [module, setModule] = useState(''); const [action, setAction] = useState('');
  const query = usePlatformPage<PlatformAudit>('/saas/audit', { module: module || undefined, action: action || undefined });
  const context = useSaasContextMenu<PlatformAudit>(); const [detail, setDetail] = useState<PlatformAudit | null>(null);
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Auditoría global</h1>
    <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200 flex flex-col sm:flex-row gap-3">
      <ComerziaInput label="Módulo" value={module} onChange={e => { setModule(e.target.value); query.pagination.onPageChange(0); }} />
      <ComerziaInput label="Acción" value={action} onChange={e => { setAction(e.target.value); query.pagination.onPageChange(0); }} />
    </div>
    {query.isError && <p role="alert">No se pudo cargar la auditoría.</p>}
    <ComerziaResponsiveTable data={query.data?.content ?? []} isLoading={query.isPending} pagination={query.pagination} onActions={context.open}
      columns={[{ header: 'Fecha', render: row => formatDateForUser(row.occurredAt) }, { header: 'Empresa', accessorKey: 'companyName' },
        { header: 'Usuario', accessorKey: 'username' }, { header: 'Módulo', accessorKey: 'module' }, { header: 'Acción', accessorKey: 'action' }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}><ContextMenuItem icon={Eye} label="Ver cambios" onClick={() => { setDetail(context.menu.item); context.close(); }} /></ComerziaContextMenu>
    <ComerziaModal isOpen={!!detail} onClose={() => setDetail(null)} title="Cambios registrados" variant="view">
      <div className="grid sm:grid-cols-2 gap-4"><div><h3>Antes</h3><pre className="whitespace-pre-wrap break-all text-xs">{detail?.before ?? 'No registrado'}</pre></div>
      <div><h3>Después</h3><pre className="whitespace-pre-wrap break-all text-xs">{detail?.after ?? 'No registrado'}</pre></div></div>
    </ComerziaModal>
  </div>;
}
