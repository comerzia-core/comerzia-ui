import { useState } from 'react';
import { Eye, KeyRound, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDateForUser } from '../../../utils/date';
import { usePlatformPage } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { TenantAccountAssistanceDialog, TenantAccountMenuItems } from '../components/TenantAccountAssistance';
import { useTenantAccountAssistance } from '../hooks/useTenantAccountAssistance';
import type { SupportAccount, SupportLog } from '../types/financial';

export function SaasSupportPage({ audit = false }: { audit?: boolean }) {
  const [search, setSearch] = useState('');
  const [locked, setLocked] = useState(false);
  const debounced = useDebounce(search, 300);
  const { id } = useParams();

  const accounts = usePlatformPage<SupportAccount>(
    '/saas/support/accounts',
    { search: debounced, companyId: id, locked: locked ? 'true' : undefined },
    !audit
  );
  const logs = usePlatformPage<SupportLog>(
    '/saas/support/audit-log',
    { search: debounced },
    audit
  );

  const context = useSaasContextMenu<SupportAccount>();
  const navigate = useNavigate();

  const assistance = useTenantAccountAssistance();

  const PageIcon = audit ? ShieldAlert : KeyRound;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <PageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              {audit ? 'Bitácora de asistencia' : 'Accesos de clientes'}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              {audit
                ? 'Historial inmutable de asistencias, restablecimientos y desbloqueos técnicos.'
                : 'Mesa de ayuda centralizada para soporte de usuarios en empresas clientes.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS ESTÁNDAR */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              label="Buscar"
              aria-label="Buscar"
              placeholder={
                audit
                  ? 'Empresa, operador o usuario'
                  : 'Usuario, correo, NIT o empresa'
              }
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                accounts.pagination.onPageChange(0);
                logs.pagination.onPageChange(0);
              }}
            />
          </div>

          {!audit && (
            <div className="sm:ml-auto flex items-center">
              <ComerziaCheckbox
                label="Solo cuentas bloqueadas"
                checked={locked}
                onChange={value => {
                  setLocked(value);
                  accounts.pagination.onPageChange(0);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {(audit ? logs.isError : accounts.isError) && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar la consulta de soporte.</span>
        </div>
      )}

      {/* 3. TABLA RESPONSIVA */}
      {audit ? (
        <ComerziaResponsiveTable
          data={logs.data?.content ?? []}
          pagination={logs.pagination}
          isLoading={logs.isPending}
          columns={[
            {
              header: 'Fecha',
              render: row => formatDateForUser(row.occurredAt),
            },
            { header: 'Operador', accessorKey: 'operator' },
            { header: 'Empresa', accessorKey: 'companyName' },
            { header: 'Usuario', accessorKey: 'target' },
            {
              header: 'Acción',
              render: row => (
                <span className={`badge badge-sm font-semibold ${row.action === 'UNLOCK' ? 'badge-success text-success-content' : 'badge-warning text-warning-content'}`}>
                  {row.actionLabel}
                </span>
              ),
            },
            { header: 'Motivo', accessorKey: 'reason' },
          ]}
        />
      ) : (
        <ComerziaResponsiveTable
          data={accounts.data?.content ?? []}
          pagination={accounts.pagination}
          isLoading={accounts.isPending}
          onActions={context.open}
          columns={[
            { header: 'Empresa', accessorKey: 'companyName' },
            { header: 'Nombre', accessorKey: 'fullName' },
            { header: 'Usuario', render: row => <span className="font-mono text-xs font-semibold">{row.username}</span> },
            { header: 'Correo', accessorKey: 'email' },
            {
              header: 'Acceso',
              render: row => (
                <span className={`badge badge-sm font-semibold ${row.disabled ? 'badge-error text-error-content' : row.locked ? 'badge-warning text-warning-content' : row.requiresPasswordChange ? 'badge-info text-info-content' : 'badge-success text-success-content'}`}>
                  {row.disabled
                    ? 'Inhabilitado'
                    : row.locked
                    ? 'Bloqueado'
                    : row.requiresPasswordChange
                    ? 'Cambio pendiente'
                    : 'Habilitado'}
                </span>
              ),
            },
          ]}
        />
      )}

      {/* 4. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        <ContextMenuItem
          icon={Eye}
          label="Ver cuentas de la empresa"
          onClick={() => {
            if (context.menu.item) {
              navigate(
                '/saas/support/tenants/' +
                  encodeURIComponent(context.menu.item.companyId) +
                  '/users'
              );
            }
            context.close();
          }}
        />

        <TenantAccountMenuItems account={context.menu.item}
          onSelect={operation => { if (context.menu.item) assistance.open(context.menu.item, operation); context.close(); }} />
      </ComerziaContextMenu>

      <TenantAccountAssistanceDialog assistance={assistance} />
    </div>
  );
}
