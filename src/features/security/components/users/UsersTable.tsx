import React, { useState, useRef } from 'react';
import {
  UserCheck,
  UserX,
  Unlock,
  Key,
  UserCog,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight
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
  // Estado para el menú contextual de clic derecho / long-press
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

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
          <ComerziaBadge
            label={row.statusTypeName || (row.disabled ? 'Deshabilitado' : 'Activo')}
            variant={getStatusBadgeVariant(row.statusTypeCode, row.disabled)}
          />

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

  const usersList = data?.content || [];

  return (
    <>
      {/* VISTA DESKTOP: TABLA */}
      <div className="hidden md:block">
        <ComerziaTable
          columns={columns}
          data={usersList}
          isLoading={isLoading}
          showRowNumbers={true}
          pagination={paginationConfig}
          onRowContextMenu={handleContextMenu}
          rowClassName={() => 'hover:!bg-primary/10 transition-colors cursor-pointer'}
        />
      </div>

      {/* VISTA MOBILE: CARDS */}
      <div className="block md:hidden space-y-2.5 p-3">
        {isLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : usersList.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron usuarios.
          </div>
        ) : (
          usersList.map((user) => (
            <div
              key={user.id}
              onTouchStart={(e) => {
                touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                longPressTimerRef.current = setTimeout(() => {
                  if (navigator.vibrate) navigator.vibrate(40);
                  setContextMenu({
                    isOpen: true,
                    x: touchStartPosRef.current.x,
                    y: touchStartPosRef.current.y,
                    user
                  });
                }, 500);
              }}
              onTouchEnd={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              onTouchMove={(e) => {
                const moveX = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
                const moveY = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
                if (moveX > 10 || moveY > 10) {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, user)}
              className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs select-none"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm text-base-content block">{user.fullName || 'Usuario'}</span>
                  <span className="font-mono text-xs text-primary font-semibold block">@{user.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ComerziaBadge
                    label={user.statusTypeName || (user.disabled ? 'Deshabilitado' : 'Activo')}
                    variant={getStatusBadgeVariant(user.statusTypeCode, user.disabled)}
                  />
                  {user.locked && (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1 border-t border-base-200/50">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((r, i) => (
                    <span key={i} className="badge badge-xs badge-neutral font-semibold">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-base-content/40 italic">Sin roles</span>
                )}
              </div>

              {user.lastLoginAt && (
                <div className="text-[10px] text-base-content/50 pt-1 flex items-center gap-1">
                  <Calendar size={12} className="text-primary/70" />
                  <span>Último acceso: {formatDateForUser(user.lastLoginAt)}</span>
                </div>
              )}
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

      {/* MENÚ CONTEXTUAL */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.user && (
          <>
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

            {contextMenu.user.locked && (
              <ContextMenuItem
                icon={Unlock}
                label="Desbloquear usuario"
                onClick={() => {
                  if (contextMenu.user) onUnlockRequest(contextMenu.user);
                }}
              />
            )}

            <ContextMenuItem
              icon={Key}
              label="Resetear contraseña"
              onClick={() => {
                if (contextMenu.user) onResetPasswordRequest(contextMenu.user);
              }}
            />

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
