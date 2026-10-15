import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArchiveRestore } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePlatformPage } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { CreateCompanyWizard } from '../components/companies/CreateCompanyWizard';
import { CompanyCredentialsModal } from '../components/companies/CompanyCredentialsModal';
import type { CompanyCreatedResponse } from '../types/company';
import type { PlatformTenant } from '../types/platform';

export function SaasDirectoryPage({ recovery = false }: { recovery?: boolean }) {
  const [search, setSearch] = useState(''); const query = useDebounce(search, 300);
  const data = usePlatformPage<PlatformTenant>('/saas/directory', { query });
  const navigate = useNavigate(); const { can } = usePermission(); const context = useSaasContextMenu<PlatformTenant>();
  const [wizard, setWizard] = useState(false); const [credentials, setCredentials] = useState<CompanyCreatedResponse | null>(null);
  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between gap-3"><div><h1 className="text-2xl font-bold">{recovery ? 'Recuperación de datos' : 'Empresas clientes'}</h1>
      <p className="text-sm text-base-content/60">{recovery ? 'Selecciona una empresa desde sus acciones.' : 'Directorio de tenants de Comerzia.'}</p></div>
      {!recovery && can('SYS_COMPANIES_MANAGE') && <BtnCreate responsive={false} label="Nueva empresa" onClick={() => setWizard(true)} />}
    </div>
    <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
      <ComerziaInput icon="Search" aria-label="Buscar empresa" placeholder="Nombre o NIT" value={search} className="w-full sm:w-80"
        onChange={event => { setSearch(event.target.value); data.pagination.onPageChange(0); }} />
    </div>
    {data.isError && <p role="alert">No se pudo cargar el directorio.</p>}
    <ComerziaResponsiveTable data={data.data?.content ?? []} isLoading={data.isPending} pagination={data.pagination} onActions={context.open}
      columns={[{ header: 'Empresa', accessorKey: 'commercialName' }, { header: 'Razón social', accessorKey: 'legalName' },
        { header: 'NIT', accessorKey: 'taxId' }, { header: 'Plan', accessorKey: 'planName' }, { header: 'Estado', accessorKey: 'subscriptionLabel' }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}>
      <ContextMenuItem icon={recovery ? ArchiveRestore : Eye} label={recovery ? 'Ver registros eliminados' : 'Ver empresa'} onClick={() => {
        if (context.menu.item) navigate(recovery ? '/saas/data-recovery/' + encodeURIComponent(context.menu.item.id) : '/saas/companies/' + encodeURIComponent(context.menu.item.id)); context.close();
      }} />
    </ComerziaContextMenu>
    {can('SYS_COMPANIES_MANAGE') && <CreateCompanyWizard isOpen={wizard} onClose={() => setWizard(false)} onSuccess={value => { setCredentials(value); void data.refetch(); }} />}
    <CompanyCredentialsModal isOpen={!!credentials} data={credentials} onClose={() => setCredentials(null)} />
  </div>;
}
