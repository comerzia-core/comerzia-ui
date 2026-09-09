import React, { useState } from 'react';
import { User, Calendar, Network, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from 'lucide-react';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
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
  // Estado para el menú contextual (desktop: clic derecho con coords; mobile: centrado en pantalla)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    log: AuditLogResponse | null;
    isCentered: boolean;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    log: null,
    isCentered: false
  });

  const handleContextMenu = (e: React.MouseEvent, log: AuditLogResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      log,
      isCentered: false
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, log: AuditLogResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      log,
      isCentered: true
    });
  };

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
          <span>{formatDateForUser(row.date)}</span>
        </div>
      )
    },
    {
      header: 'Usuario',
      accessorKey: 'userFullName',
      render: row => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-base-content">
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
          onRowContextMenu={handleContextMenu}
          rowClassName={() => 'hover:bg-primary/10 transition-colors cursor-pointer group'}
        />
      </div>

      {/* VISTA MOBILE: CARDS */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : logsList.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron registros de auditoría.
          </div>
        ) : (
          logsList.map((log, index) => (
            <article
              key={log.id}
              onClick={(e) => handleMobileCardTap(e, log)}
              className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 cursor-pointer hover:border-primary/40 select-none"
            >
              {/* FILA SUPERIOR: NUMERACIÓN, USUARIO Y BADGE DE ACCIÓN */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                    {page * pageSize + index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                      {log.userFullName || 'Sistema'}
                    </h3>
                    <p className="text-[11px] font-mono text-base-content/50 truncate">
                      {log.ipAddress || '127.0.0.1'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <ComerziaBadge label={log.action} variant={getBadgeVariant(log.action)} />
                </div>
              </div>

              {/* MÓDULO Y ENTIDAD AFECTADA */}
              <div className="pl-[26px] flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-semibold text-base-content/50 uppercase mr-1">
                  Módulo:
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral text-neutral-content tracking-wider uppercase">
                  {log.module}
                </span>
                <span className="text-[11px] font-medium text-base-content/80">
                  • {log.entity}
                </span>
              </div>

              {/* FECHA Y HORA DE REGISTRO */}
              <div className="pl-[26px] pt-1.5 border-t border-base-100 flex items-center justify-between text-[11px] text-base-content/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                  <span>
                    Fecha: <strong className="font-medium text-base-content/80">{formatDateForUser(log.date)}</strong>
                  </span>
                </div>
              </div>
            </article>
          ))
        )}

        {/* PAGINACIÓN MOBILE */}
        {data && (
          <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
            {/* Cantidad y resumen de página */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span>Mostrar</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span className="whitespace-nowrap">de {data.totalElements} registros</span>
              </div>
              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                Página {page + 1} de {Math.max(1, data.totalPages)}
              </span>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                aria-label="Primera página"
                disabled={page === 0 || isLoading}
                onClick={() => onPageChange(0)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 0 || isLoading}
                onClick={() => onPageChange(Math.max(0, page - 1))}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={page >= data.totalPages - 1 || isLoading}
                onClick={() => onPageChange(page + 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Última página"
                disabled={page >= data.totalPages - 1 || isLoading}
                onClick={() => onPageChange(data.totalPages - 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* MENÚ CONTEXTUAL */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.log && (
          <ContextMenuItem
            icon={Eye}
            label="Ver detalle de auditoría"
            onClick={() => {
              if (contextMenu.log) onSelectLog(contextMenu.log);
            }}
          />
        )}
      </ComerziaContextMenu>
    </>
  );
};
