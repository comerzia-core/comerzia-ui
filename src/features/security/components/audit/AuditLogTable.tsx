// src/features/security/components/audit/AuditLogTable.tsx
import { User, Calendar, Network } from 'lucide-react';
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

  // Definición de columnas de la tabla de auditoría (sin newValues ni acciones explícitas)
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

  // Configuración de Paginación de Spring Boot (página actual base 0)
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

  return (
    <ComerziaTable
      columns={columns}
      data={data?.content || []}
      isLoading={isLoading}
      showRowNumbers={true}
      pagination={paginationConfig}
      onRowClick={onSelectLog}
      rowClassName={() => 'hover:bg-primary/10 transition-colors cursor-pointer group'}
    />
  );
};
