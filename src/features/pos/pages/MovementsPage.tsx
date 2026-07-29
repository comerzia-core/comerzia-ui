// src/features/pos/pages/MovementsPage.tsx
import { useState, useEffect } from 'react';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCreate, CrudButtons } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import type { MovementResponse } from '../types/pos';
import { useToast } from '../../../context/ToastContext';
import { MovementModal } from '../components/MovementModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useAuthStore } from '../../../stores/useAuthStore';

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
      // Silenciosamente establecemos activeShiftId como null sin mostrar toast info
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

  // Botón deshabilitado si el usuario no tiene el rol CASHIER o no tiene un turno abierto
  const isCreateDisabled = !isCashier || !activeShiftId;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Movimientos de Caja</h1>
          <p className="text-base-content/60 mt-1">Ingresos y egresos de efectivo manuales</p>
        </div>
        <BtnCreate
          label="Nuevo Movimiento"
          onClick={() => {
            setMovementToEdit(null);
            setIsModalOpen(true);
          }}
          disabled={isCreateDisabled}
          title={
            !isCashier
              ? 'Se requiere el rol de Cajero'
              : !activeShiftId
              ? 'Debes tener un turno abierto'
              : undefined
          }
        />
      </div>

      <ComerziaTable
        data={movements}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
        showRowNumbers={true}
      />

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
