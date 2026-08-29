import { useState, useEffect, useRef } from 'react';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCreate, CrudButtons } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import type { MovementResponse } from '../types/pos';
import { useToast } from '../../../context/ToastContext';
import { MovementModal } from '../components/MovementModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';

export const MovementsPage = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [movements, setMovements] = useState<MovementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Active shift logic
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<MovementResponse | null>(null);
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null);

  // Context Menu & Long Press
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; row: MovementResponse | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    row: null
  });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];
  const isOwner = roles.includes('OWNER');
  const isManager = roles.includes('BRANCH_MANAGER');
  const isCashier = roles.includes('CASHIER');

  const currency = userProfile?.companySettings?.currencyCode || '$';

  useEffect(() => {
    loadActiveShift();
    loadMovements();
  }, [page, size]);

  const loadActiveShift = async () => {
    if (!isCashier) {
      setActiveShiftId(null);
      return;
    }
    try {
      const summary = await posService.getMyActiveShiftSummary();
      setActiveShiftId(summary.id);
    } catch (err: any) {
      setActiveShiftId(null);
    }
  };

  const loadMovements = async () => {
    setIsLoading(true);
    try {
      const data = await posService.getMovements(page, size, undefined, true);
      setMovements(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error loading movements:', error);
      toastError('No se pudieron cargar los movimientos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!movementToDelete) return;
    try {
      await posService.deleteMovement(movementToDelete);
      toastSuccess('Movimiento eliminado.');
      setMovementToDelete(null);
      loadMovements();
    } catch (error: any) {
      console.error('Error deleting movement:', error);
      const apiMsg = error.response?.data?.message || error.response?.data?.error;
      toastError(apiMsg || 'No se pudo eliminar el movimiento.');
    }
  };

  const columns = [
    {
      header: 'Hora',
      render: (row: MovementResponse) => (row.date ? new Date(row.date).toLocaleTimeString() : '-')
    },
    isOwner && { header: 'Sucursal', accessorKey: 'branchName' },
    (isOwner || isManager) && { header: 'Caja', accessorKey: 'cashRegisterName' },
    (isOwner || isManager) && { header: 'Empleado', accessorKey: 'employeeName' },
    { header: 'Tipo', render: (row: MovementResponse) => row.movementType?.label || '-' },
    { header: 'Método', render: (row: MovementResponse) => row.paymentType?.label || '-' },
    { header: 'Monto', render: (row: MovementResponse) => `${currency} ${row.amount ? row.amount.toFixed(2) : '0.00'}` },
    { header: 'Observación', accessorKey: 'observation' },
    {
      header: 'Acciones',
      className: 'w-24',
      render: (row: MovementResponse) => (
        <CrudButtons
          onEdit={() => {
            setMovementToEdit(row);
            setIsModalOpen(true);
          }}
          onDelete={() => setMovementToDelete(row.id)}
        />
      )
    }
  ].filter(Boolean) as Column<MovementResponse>[];

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages,
    onPageChange: setPage,
    onPageSizeChange: newSize => {
      setSize(newSize);
      setPage(0);
    }
  };

  const isCreateDisabled = !isCashier || !activeShiftId;

  return (
    <div className="space-y-6 animate-fade-in px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content tracking-tight">Movimientos de Caja</h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">Ingresos y egresos de efectivo manuales</p>
        </div>
        <BtnCreate
          label="Nuevo Movimiento"
          onClick={() => {
            setMovementToEdit(null);
            setIsModalOpen(true);
          }}
          disabled={isCreateDisabled}
          responsive={true}
          className="w-full sm:w-auto"
          title={
            !isCashier
              ? 'Se requiere el rol de Cajero'
              : !activeShiftId
              ? 'Debes tener un turno abierto'
              : undefined
          }
        />
      </div>

      {/* VISTA DESKTOP: TABLA */}
      <div className="hidden md:block">
        <ComerziaTable
          data={movements}
          columns={columns}
          isLoading={isLoading}
          pagination={pagination}
          showRowNumbers={true}
          onRowContextMenu={(e, row) => {
            e.preventDefault();
            setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, row });
          }}
        />
      </div>

      {/* VISTA MOBILE: CARDS */}
      <div className="block md:hidden space-y-3">
        {movements.length > 0 && (
          <div className="flex items-center justify-between px-2 py-1 bg-base-200/50 rounded-xl text-[11px] text-base-content/60">
            <span>{totalElements} movimientos registrados</span>
            <span className="italic">Mantén presionado para opciones</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-base-content/50 mt-2">Cargando movimientos...</p>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            <DollarSign size={32} className="mx-auto text-base-content/30 mb-2" />
            No hay movimientos de caja registrados.
          </div>
        ) : (
          <div className="space-y-2.5">
            {movements.map((mov) => {
              const isIncome = mov.movementType?.label?.toLowerCase().includes('ingreso') || mov.movementType?.code === 1;
              return (
                <div
                  key={mov.id}
                  onTouchStart={(e) => {
                    touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    longPressTimerRef.current = setTimeout(() => {
                      if (navigator.vibrate) navigator.vibrate(40);
                      setContextMenu({
                        isOpen: true,
                        x: touchStartPosRef.current.x,
                        y: touchStartPosRef.current.y,
                        row: mov
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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, row: mov });
                  }}
                  className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs select-none"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isIncome ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {isIncome ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-base-content block">
                          {mov.movementType?.label || 'Movimiento'}
                        </span>
                        <span className="text-[10px] text-base-content/50">
                          {mov.paymentType?.label || 'Efectivo'} • {mov.date ? new Date(mov.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-base font-bold font-mono ${isIncome ? 'text-success' : 'text-error'}`}>
                      {isIncome ? '+' : '-'}{currency} {mov.amount ? mov.amount.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  {mov.observation && (
                    <p className="text-base-content/70 italic bg-base-200/40 p-2 rounded-lg text-[11px]">
                      "{mov.observation}"
                    </p>
                  )}

                  {(isOwner || isManager) && (
                    <div className="flex justify-between text-[10px] text-base-content/50 pt-1 border-t border-base-200/50">
                      <span>Caja: {mov.cashRegisterName || '-'}</span>
                      <span>{mov.employeeName || '-'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación Mobile */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-1 pt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline gap-1"
              disabled={page === 0 || isLoading}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft size={16} /> Ant.
            </button>
            <span className="text-xs font-semibold text-base-content/70">
              Pág. {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline gap-1"
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => setPage(prev => prev + 1)}
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
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      >
        {contextMenu.row && (
          <>
            <ContextMenuItem 
              icon={Edit}
              label="Modificar Movimiento"
              onClick={() => {
                setMovementToEdit(contextMenu.row);
                setIsModalOpen(true);
                setContextMenu({ ...contextMenu, isOpen: false });
              }}
            />
            <ContextMenuItem 
              icon={Trash2}
              label="Eliminar Movimiento"
              variant="error"
              onClick={() => {
                if (contextMenu.row) {
                  setMovementToDelete(contextMenu.row.id);
                }
                setContextMenu({ ...contextMenu, isOpen: false });
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      {isModalOpen && (
        <MovementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadMovements}
          shiftId={activeShiftId || undefined}
          movementToEdit={movementToEdit}
        />
      )}

      <ConfirmationModal
        isOpen={!!movementToDelete}
        onClose={() => setMovementToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Movimiento"
        message="¿Estás seguro que deseas eliminar este movimiento? Esta acción actualizará el arqueo de tu caja."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};
