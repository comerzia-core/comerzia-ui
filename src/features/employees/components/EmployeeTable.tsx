// src/features/employees/components/EmployeeTable.tsx
import React, { useState } from 'react';
import {
  Building2,
  IdCard,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import type { EmployeeSummaryResponse } from '../types/employee';
import type { PageResponse } from '../../../types/api';

interface Props {
  data: PageResponse<EmployeeSummaryResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onViewDetails: (employee: EmployeeSummaryResponse) => void;
  onEdit: (employee: EmployeeSummaryResponse) => void;
  onDelete: (employee: EmployeeSummaryResponse) => void;
}

export const EmployeeTable = ({
  data,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  onEdit,
  onDelete
}: Props) => {
  // Estado para el menú contextual (desktop: clic derecho con coords; mobile: centrado en pantalla)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    employee: EmployeeSummaryResponse | null;
    isCentered: boolean;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    employee: null,
    isCentered: false
  });

  const handleContextMenu = (e: React.MouseEvent, employee: EmployeeSummaryResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      employee,
      isCentered: false
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, employee: EmployeeSummaryResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      employee,
      isCentered: true
    });
  };

  const columns: Column<EmployeeSummaryResponse>[] = [
    {
      header: 'Empleado',
      accessorKey: 'fullName',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <span className="font-bold text-sm text-base-content block line-clamp-1">
              {row.fullName}
            </span>
            <span className="font-mono text-xs text-base-content/60 inline-flex items-center gap-1 whitespace-nowrap">
              <IdCard size={12} className="text-primary/70 shrink-0" /> {row.documentNumber}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Sucursal',
      accessorKey: 'branchName',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/80 font-medium">
          <Building2 size={14} className="text-primary/70 shrink-0" />
          <span>{row.branchName || 'Sin sucursal'}</span>
        </div>
      )
    },
    {
      header: 'Roles',
      render: row => (
        <div className="flex flex-wrap gap-1 max-w-[240px]">
          {row.roleNames && row.roleNames.length > 0 ? (
            row.roleNames.map((role, idx) => (
              <span
                key={idx}
                className="badge badge-sm badge-neutral font-semibold border-0 text-[11px]"
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-xs text-base-content/40 italic">Sin roles</span>
          )}
        </div>
      )
    },
    {
      header: 'Estado de Acceso',
      render: row => (
        <ComerziaBadge
          label={row.userEnabled ? 'Activo' : 'Inactivo'}
          variant={row.userEnabled ? 'success' : 'error'}
        />
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

  const employeesList = data?.content || [];

  return (
    <>
      {/* VISTA DESKTOP: TABLA */}
      <div className="hidden md:block">
        <ComerziaTable
          columns={columns}
          data={employeesList}
          isLoading={isLoading}
          showRowNumbers={true}
          pagination={paginationConfig}
          onRowContextMenu={handleContextMenu}
          rowClassName={() => 'hover:!bg-primary/10 transition-colors cursor-pointer'}
        />
      </div>

      {/* VISTA MOBILE: CARDS */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : employeesList.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron empleados.
          </div>
        ) : (
          employeesList.map((employee, index) => (
            <article
              key={employee.id}
              onClick={(e) => handleMobileCardTap(e, employee)}
              className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
            >
              {/* FILA SUPERIOR: NUMERACIÓN, NOMBRES Y BADGE */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                    {page * pageSize + index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                      {employee.fullName}
                    </h3>
                    <p className="text-xs font-mono text-base-content/60 flex items-center gap-1 mt-0.5">
                      <IdCard size={12} className="text-primary/70" /> {employee.documentNumber}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <ComerziaBadge
                    label={employee.userEnabled ? 'Activo' : 'Inactivo'}
                    variant={employee.userEnabled ? 'success' : 'error'}
                  />
                </div>
              </div>

              {/* SUCURSAL */}
              <div className="pl-[26px] flex items-center gap-1.5 text-xs text-base-content/70">
                <Building2 size={13} className="text-primary/70 shrink-0" />
                <span className="truncate">{employee.branchName || 'Sin sucursal'}</span>
              </div>

              {/* ROLES ASIGNADOS */}
              <div className="pl-[26px] flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-semibold text-base-content/50 uppercase mr-1">
                  Roles:
                </span>
                {employee.roleNames && employee.roleNames.length > 0 ? (
                  employee.roleNames.map((roleName, rIdx) => (
                    <span
                      key={rIdx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral text-neutral-content tracking-wider uppercase"
                    >
                      {roleName}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-base-content/40 italic">Sin roles asignados</span>
                )}
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
        {contextMenu.employee && (
          <>
            <ContextMenuItem
              icon={Eye}
              label="Ver ficha del empleado"
              onClick={() => {
                if (contextMenu.employee) onViewDetails(contextMenu.employee);
              }}
            />
            <ContextMenuItem
              icon={Pencil}
              label="Editar empleado"
              onClick={() => {
                if (contextMenu.employee) onEdit(contextMenu.employee);
              }}
            />
            <ContextMenuItem
              icon={Trash2}
              label="Eliminar empleado"
              variant="error"
              onClick={() => {
                if (contextMenu.employee) onDelete(contextMenu.employee);
              }}
            />
          </>
        )}
      </ComerziaContextMenu>
    </>
  );
};
