import { User, Calendar, Network, ChevronLeft, ChevronRight } from 'lucide-react';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { formatDateForUser } from '../../../../utils/date';
import type { AuditLogResponse } from '../../types/audit';
import type { PageResponse } from '../../../../types/api';

interface Props {
  data: PageResponse<AuditLogResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onSelectLog: (log: AuditLogResponse) => void;
}

export const AuditLogTable = ({
  data,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectLog
}: Props) => {
  const getBadgeVariant = (actionName: string) => {
    const act = actionName.toLowerCase();
    if (act.includes('crea') || act.includes('insert')) return 'success';
    if (act.includes('elimin') || act.includes('delete') || act.includes('borrar')) return 'error';
    if (act.includes('modific') || act.includes('update') || act.includes('edit')) return 'info';
    return 'neutral';
  };

  const columns: Column<AuditLogResponse>[] = [
    {
      header: 'Fecha y Hora',
      accessorKey: 'date',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-2 text-xs font-semibold text-base-content">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span>{formatDateForUser(row.date)}</span>
        </div>
      )
    },
    {
      header: 'Usuario',
      accessorKey: 'userFullName',
      render: row => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-base-content group-hover:text-primary transition-colors">
            {row.userFullName || 'Sistema'}
          </span>
        </div>
      )
    },
    {
      header: 'Acción',
      accessorKey: 'action',
      render: row => <ComerziaBadge label={row.action} variant={getBadgeVariant(row.action)} />
    },
    {
      header: 'Módulo / Entidad',
      render: row => (
        <div className="space-y-0.5">
          <span className="badge badge-sm badge-neutral font-semibold">{row.module}</span>
          <p className="text-xs text-base-content/70 font-medium">{row.entity}</p>
        </div>
      )
    },
    {
      header: 'Dirección IP',
      accessorKey: 'ipAddress',
      render: row => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-base-content/70">
          <Network className="w-3.5 h-3.5 text-base-content/40" />
          <span>{row.ipAddress || '127.0.0.1'}</span>
        </div>
      )
    }
  ];

  const paginationConfig = data
    ? {
      currentPage: page,
      pageSize: pageSize,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      onPageChange: onPageChange,
      onPageSizeChange: onPageSizeChange
    }
    : undefined;

  const logsList = data?.content || [];

  return (
    <>
      {/* VISTA DESKTOP: TABLA */}
      <div className="hidden md:block">
        <ComerziaTable
          columns={columns}
          data={logsList}
          isLoading={isLoading}
          showRowNumbers={true}
          pagination={paginationConfig}
          onRowClick={onSelectLog}
          rowClassName={() => 'hover:bg-primary/10 transition-colors cursor-pointer group'}
        />
      </div>

      {/* VISTA MOBILE: CARDS */}
      <div className="block md:hidden space-y-2.5 p-3">
        {isLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : logsList.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron registros de auditoría.
          </div>
        ) : (
          logsList.map((log) => (
            <div
              key={log.id}
              onClick={() => onSelectLog(log)}
              className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                    <User size={12} />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-base-content block leading-tight">{log.userFullName || 'Sistema'}</span>
                    <span className="text-[10px] text-base-content/50">{formatDateForUser(log.date)}</span>
                  </div>
                </div>
                <ComerziaBadge label={log.action} variant={getBadgeVariant(log.action)} />
              </div>

              <div className="flex justify-between items-center text-[11px] text-base-content/70 pt-1.5 border-t border-base-200/50">
                <span>{log.module} • <strong>{log.entity}</strong></span>
                <span className="font-mono text-[10px] text-base-content/50">{log.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>
          ))
        )}

        {/* Paginación Mobile */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-between items-center px-1 pt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline gap-1"
              disabled={page === 0 || isLoading}
              onClick={() => onPageChange(Math.max(0, page - 1))}
            >
              <ChevronLeft size={16} /> Ant.
            </button>
            <span className="text-xs font-semibold text-base-content/70">
              Pág. {page + 1} de {data.totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline gap-1"
              disabled={page >= data.totalPages - 1 || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Sig. <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
