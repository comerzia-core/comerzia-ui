import { useState } from 'react';
import { Activity, Eye } from 'lucide-react';
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
  const context = useSaasContextMenu<PlatformAudit>();
  const [detail, setDetail] = useState<PlatformAudit | null>(null);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Auditoría global
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Trazabilidad inmutable de mutaciones, cambios de estado y acciones operativas.
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS ESTÁNDAR */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200 space-y-3">
        {/* Selector de Empresa */}
        <div className="flex flex-wrap items-center gap-2">
          <BtnDetails
            responsive={false}
            label={filters.company?.commercialName ?? 'Filtrar empresa'}
            onClick={() => filters.setSelectingCompany(true)}
          />
          {filters.company && (
            <BtnCancel
              responsive={false}
              label="Todas las empresas"
              onClick={() => {
                filters.setCompany(null);
                query.pagination.onPageChange(0);
              }}
            />
          )}
        </div>

        {/* Inputs de filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {(['module', 'action', 'username', 'from', 'until'] as const).map((key, index) => (
            <ComerziaInput
              key={key}
              label={['Módulo', 'Acción', 'Usuario', 'Desde (hora local)', 'Hasta (hora local)'][index]}
              type={key === 'from' || key === 'until' ? 'datetime-local' : 'text'}
              value={filters.filters[key]}
              onChange={event => {
                filters.setFilters(current => ({ ...current, [key]: event.target.value }));
                query.pagination.onPageChange(0);
              }}
            />
          ))}
        </div>
      </div>

      {query.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar la bitácora de auditoría.</span>
        </div>
      )}

      {/* 3. TABLA RESPONSIVA */}
      <ComerziaResponsiveTable
        data={query.data?.content ?? []}
        isLoading={query.isPending}
        pagination={query.pagination}
        onActions={context.open}
        columns={[
          {
            header: 'Fecha',
            render: row => formatDateForUser(row.occurredAt),
          },
          { header: 'Empresa', accessorKey: 'companyName' },
          {
            header: 'Usuario',
            render: row => <span className="font-mono text-xs font-semibold">{row.username}</span>,
          },
          {
            header: 'Módulo',
            render: row => <span className="badge badge-xs badge-neutral font-medium">{row.module}</span>,
          },
          {
            header: 'Acción',
            render: row => (
              <span className={`badge badge-sm font-semibold ${row.action === 'DELETE' ? 'badge-error text-error-content' : row.action === 'CREATE' ? 'badge-success text-success-content' : 'badge-info text-info-content'}`}>
                {row.action}
              </span>
            ),
          },
        ]}
      />

      {/* 4. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        <ContextMenuItem
          icon={Eye}
          label="Ver cambios"
          onClick={() => {
            setDetail(context.menu.item);
            context.close();
          }}
        />
      </ComerziaContextMenu>

      {/* MODAL: SELECCIÓN DE EMPRESA */}
      <ComerziaModal
        isOpen={filters.selectingCompany}
        onClose={() => filters.setSelectingCompany(false)}
        title="Filtrar por empresa cliente"
        size="xl"
      >
        {filters.selectingCompany && (
          <SaasDirectoryPage
            onSelect={company => {
              filters.setCompany(company);
              filters.setSelectingCompany(false);
              query.pagination.onPageChange(0);
            }}
          />
        )}
      </ComerziaModal>

      {/* MODAL: VISOR DIFERENCIAL (DIFF VIEWER) */}
      <ComerziaModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title="Cambios registrados"
        variant="view"
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/60">
              Estado Anterior (Before)
            </h3>
            <pre className="p-3 bg-base-200 rounded-xl border border-base-300 whitespace-pre-wrap break-all text-xs font-mono max-h-72 overflow-y-auto">
              {detail?.before ?? 'No registrado'}
            </pre>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/60">
              Estado Posterior (After)
            </h3>
            <pre className="p-3 bg-base-200 rounded-xl border border-base-300 whitespace-pre-wrap break-all text-xs font-mono max-h-72 overflow-y-auto">
              {detail?.after ?? 'No registrado'}
            </pre>
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
}
