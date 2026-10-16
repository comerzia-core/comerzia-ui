import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, ArchiveRestore, KeyRound } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { formatDateForUser } from '../../../utils/date';
import { usePermission } from '../../../hooks/usePermission';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePlatformPage } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import type { PlatformTenant } from '../types/platform';

export function SaasDirectoryPage({
  recovery = false,
  onSelect,
}: {
  recovery?: boolean;
  onSelect?: (company: PlatformTenant) => void;
}) {
  const [search, setSearch] = useState('');
  const query = useDebounce(search, 300);
  const [plan, setPlan] = useState('');
  const [active, setActive] = useState(false);

  const { options } = useLoadDictionaries([DICTIONARIES.PLAN_TYPE]);
  const data = usePlatformPage<PlatformTenant>('/saas/directory', {
    query,
    plan: plan || undefined,
    active: active ? 'true' : undefined,
  });

  const navigate = useNavigate();
  const { can } = usePermission();
  const context = useSaasContextMenu<PlatformTenant>();

  const PageIcon = recovery ? ArchiveRestore : Building2;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <PageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              {recovery ? 'Recuperación de datos' : 'Empresas clientes'}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              {recovery
                ? 'Selecciona una empresa cliente para auditar y restaurar registros eliminados.'
                : 'Directorio central de empresas clientes (tenants) registradas en Comerzia.'}
            </p>
          </div>
        </div>

        {/* Botón de Alta de Empresa */}
        {!recovery && !onSelect && can('SYS_COMPANIES_MANAGE') && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <BtnCreate
              responsive={false}
              label="Nueva empresa"
              onClick={() => navigate('/saas/tenants/new')}
            />
          </div>
        )}
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y FILTROS ESTÁNDAR */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full flex-wrap">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              aria-label="Buscar empresa"
              placeholder="Nombre, NIT o código de acceso"
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                data.pagination.onPageChange(0);
              }}
            />
          </div>

          <div className="w-full sm:w-56">
            <ComerziaSelect
              label="Plan"
              value={plan}
              options={options[DICTIONARIES.PLAN_TYPE] ?? []}
              enableDefaultOption
              placeholder="Todos los planes"
              onChange={event => {
                setPlan(event.target.value);
                data.pagination.onPageChange(0);
              }}
            />
          </div>

          <div className="sm:ml-auto flex items-center">
            <ComerziaCheckbox
              label="Solo empresas habilitadas"
              checked={active}
              onChange={value => {
                setActive(value);
                data.pagination.onPageChange(0);
              }}
            />
          </div>
        </div>
      </div>

      {data.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar el directorio de empresas.</span>
        </div>
      )}

      {/* 3. TABLA RESPONSIVA / CARDS MÓVIL */}
      <ComerziaResponsiveTable
        data={data.data?.content ?? []}
        isLoading={data.isPending}
        pagination={data.pagination}
        onActions={context.open}
        columns={[
          { header: 'Empresa', accessorKey: 'commercialName' },
          { header: 'Razón social', accessorKey: 'legalName' },
          { header: 'NIT', render: row => <span className="font-mono text-xs">{row.taxId}</span> },
          { header: 'Plan', accessorKey: 'planName' },
          {
            header: 'Estado',
            render: row => (
              <span className={`badge badge-sm font-semibold ${row.active ? 'badge-success text-success-content' : 'badge-error text-error-content'}`}>
                {row.subscriptionLabel || (row.active ? 'Activa' : 'Suspendida')}
              </span>
            ),
          },
          {
            header: 'Registro',
            render: row => (row.registeredAt ? formatDateForUser(row.registeredAt) : 'Sin registro'),
          },
          ...(can('SYS_FINANCE_READ')
            ? [
                {
                  header: 'MRR (Bs)',
                  render: (row: PlatformTenant) => row.currentMrr?.toFixed(2) ?? '0.00',
                },
                {
                  header: 'Pagos por revisar (Bs)',
                  render: (row: PlatformTenant) => row.pendingReviewAmount?.toFixed(2) ?? '0.00',
                },
              ]
            : []),
        ]}
      />

      {/* 4. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        <ContextMenuItem
          icon={recovery ? ArchiveRestore : Eye}
          label={
            onSelect
              ? 'Seleccionar empresa'
              : recovery
              ? 'Ver registros eliminados'
              : 'Ver empresa'
          }
          onClick={() => {
            if (context.menu.item) {
              if (onSelect) {
                onSelect(context.menu.item);
              } else {
                navigate(
                  recovery
                    ? '/saas/system/recovery/' + encodeURIComponent(context.menu.item.id)
                    : '/saas/tenants/' + encodeURIComponent(context.menu.item.id)
                );
              }
            }
            context.close();
          }}
        />

        {!recovery && can('SYS_TENANT_USERS_READ') && (
          <ContextMenuItem
            icon={KeyRound}
            label="Ver cuentas"
            onClick={() => {
              if (context.menu.item) {
                navigate('/saas/tenants/' + encodeURIComponent(context.menu.item.id) + '?tab=users');
              }
              context.close();
            }}
          />
        )}
      </ComerziaContextMenu>
    </div>
  );
}
