import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
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
import { BtnDetails, BtnCancel } from '../../../components/ui/CrudButtons';
import { useAuditFilters } from '../hooks/useAuditFilters';
import { SaasDirectoryPage } from './SaasDirectoryPage';
export function SaasAuditPage() {
  const filters = useAuditFilters();
  const query = usePlatformPage<PlatformAudit>('/saas/audit', filters.params);
  const context = useSaasContextMenu<PlatformAudit>(); const [detail, setDetail] = useState<PlatformAudit | null>(null);
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Auditoría global</h1>
    <ComerziaSurface className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-3">
        <BtnDetails responsive={false} label={filters.company?.commercialName ?? 'Filtrar empresa'} onClick={() => filters.setSelectingCompany(true)} />
        {filters.company && <BtnCancel responsive={false} label="Todas las empresas" onClick={() => { filters.setCompany(null); query.pagination.onPageChange(0); }} />}
      </div>
      {(['module', 'action', 'username', 'from', 'until'] as const).map((key, index) => <ComerziaInput key={key}
        label={['Módulo', 'Acción', 'Usuario', 'Desde (hora de este equipo)', 'Hasta (hora de este equipo)'][index]}
        type={key === 'from' || key === 'until' ? 'datetime-local' : 'text'} value={filters.filters[key]}
        onChange={event => { filters.setFilters(current => ({ ...current, [key]: event.target.value })); query.pagination.onPageChange(0); }} />)}
    </ComerziaSurface>
    {query.isError && <p role="alert">No se pudo cargar la auditoría.</p>}
    <ComerziaResponsiveTable data={query.data?.content ?? []} isLoading={query.isPending} pagination={query.pagination} onActions={context.open}
      columns={[{ header: 'Fecha', render: row => formatDateForUser(row.occurredAt) }, { header: 'Empresa', accessorKey: 'companyName' },
        { header: 'Usuario', accessorKey: 'username' }, { header: 'Módulo', accessorKey: 'module' }, { header: 'Acción', accessorKey: 'action' }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}><ContextMenuItem icon={Eye} label="Ver cambios" onClick={() => { setDetail(context.menu.item); context.close(); }} /></ComerziaContextMenu>
    <ComerziaModal isOpen={filters.selectingCompany} onClose={() => filters.setSelectingCompany(false)} title="Empresa de la auditoría" size="xl">
      {filters.selectingCompany && <SaasDirectoryPage onSelect={company => { filters.setCompany(company); filters.setSelectingCompany(false); query.pagination.onPageChange(0); }} />}
    </ComerziaModal>
    <ComerziaModal isOpen={!!detail} onClose={() => setDetail(null)} title="Cambios registrados" variant="view">
      <div className="grid sm:grid-cols-2 gap-4"><div><h3>Antes</h3><pre className="whitespace-pre-wrap break-all text-xs">{detail?.before ?? 'No registrado'}</pre></div>
      <div><h3>Después</h3><pre className="whitespace-pre-wrap break-all text-xs">{detail?.after ?? 'No registrado'}</pre></div></div>
    </ComerziaModal>
  </div>;
}
