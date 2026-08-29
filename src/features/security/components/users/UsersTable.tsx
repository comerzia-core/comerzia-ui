// src/features/security/components/users/UsersTable.tsx
import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  Unlock,
  Key,
  UserCog,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
import { formatDateForUser } from '../../../../utils/date';
import type { UserResponse } from '../../types/user';
import type { PageResponse } from '../../../../types/api';

interface Props {
  data: PageResponse<UserResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onToggleAccessRequest: (user: UserResponse) => void;
  onUnlockRequest: (user: UserResponse) => void;
  onResetPasswordRequest: (user: UserResponse) => void;
  onModifyRolesRequest: (user: UserResponse) => void;
}

export const UsersTable = ({
  data,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onToggleAccessRequest,
  onUnlockRequest,
  onResetPasswordRequest,
  onModifyRolesRequest
}: Props) => {
  // Estado para el menú contextual de clic derecho
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    user: UserResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    user: null
  });

  const handleContextMenu = (e: React.MouseEvent, user: UserResponse) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      user
    });
  };

  const getStatusBadgeVariant = (statusTypeCode?: number, disabled?: boolean) => {
    switch (statusTypeCode) {
      case 901: return 'success'; // ACTIVE - verde
      case 902: return 'info';    // INACTIVE - azul
      case 903: return 'error';   // SUSPENDED - rojo
      case 904: return 'warning'; // PENDING - amarillo
      default: return disabled ? 'neutral' : 'success';
    }
  };

  const columns: Column<UserResponse>[] = [
    {
      header: 'Usuario',
      accessorKey: 'fullName',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <span className="font-bold text-sm text-base-content block line-clamp-1">
              {row.fullName || 'Usuario del Sistema'}
            </span>
            <span className="font-mono text-xs text-primary font-semibold block">
              @{row.username}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Estado de Cuenta',
      render: row => (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Insignia con el statusTypeName del Backend y variante mapeada por statusTypeCode */}
          <ComerziaBadge
            label={row.statusTypeName || (row.disabled ? 'Deshabilitado' : 'Activo')}
            variant={getStatusBadgeVariant(row.statusTypeCode, row.disabled)}
          />

          {/* ICONO DE ALERTA SIN FONDO NI TEXTO SOLO CUANDO LA CUENTA TIENE LOCKED === TRUE */}
          {row.locked && (
            <div
              className="inline-flex items-center justify-center text-warning animate-pulse cursor-help"
              title="Cuenta bloqueada por múltiples intentos fallidos de inicio de sesión"
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Roles Asignados',
      render: row => (
        <div className="flex flex-wrap gap-1 max-w-[240px]">
          {row.roles && row.roles.length > 0 ? (
            row.roles.map((roleName, idx) => (
              <span
                key={idx}
                className="badge badge-sm badge-neutral font-semibold border-0 text-[11px]"
              >
                {roleName}
              </span>
            ))
          ) : (
            <span className="text-xs text-base-content/40 italic">Sin roles asignados</span>
          )}
        </div>
      )
    },
    {
      header: 'Último Acceso',
      accessorKey: 'lastLoginAt',
      render: row => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/70">
          <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
          <span>{formatDateForUser(row.lastLoginAt)}</span>
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

  return (
    <>
      <ComerziaTable
        columns={columns}
        data={data?.content || []}
        isLoading={isLoading}
        showRowNumbers={true}
        pagination={paginationConfig}
        onRowContextMenu={handleContextMenu}
        rowClassName={() => 'hover:!bg-primary/10 transition-colors cursor-pointer'}
      />

      {/* MENÚ CONTEXTUAL AL HACER CLIC DERECHO EN UNA FILA */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.user && (
          <>
            {/* Opción 1: Activar o Desactivar acceso */}
            {contextMenu.user.disabled ? (
              <ContextMenuItem
                icon={UserCheck}
                label="Activar usuario"
                onClick={() => {
                  if (contextMenu.user) onToggleAccessRequest(contextMenu.user);
                }}
              />
            ) : (
              <ContextMenuItem
                icon={UserX}
                label="Desactivar usuario"
                variant="error"
                onClick={() => {
                  if (contextMenu.user) onToggleAccessRequest(contextMenu.user);
                }}
              />
            )}

            {/* Opción 2: Desbloquear usuario (si está bloqueado) */}
            {contextMenu.user.locked && (
              <ContextMenuItem
                icon={Unlock}
                label="Desbloquear usuario"
                onClick={() => {
                  if (contextMenu.user) onUnlockRequest(contextMenu.user);
                }}
              />
            )}

            {/* Opción 3: Resetear contraseña */}
            <ContextMenuItem
              icon={Key}
              label="Resetear contraseña"
              onClick={() => {
                if (contextMenu.user) onResetPasswordRequest(contextMenu.user);
              }}
            />

            {/* Opción 4: Modificar roles */}
            <ContextMenuItem
              icon={UserCog}
              label="Modificar roles"
              onClick={() => {
                if (contextMenu.user) onModifyRolesRequest(contextMenu.user);
              }}
            />
          </>
        )}
      </ComerziaContextMenu>
    </>
  );
};
