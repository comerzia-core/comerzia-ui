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
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Active shift logic (to allow creation)
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
    // Si no es un cajero, no tiene un turno personal activo, 
    // pero igual puede hacer operaciones sobre los de otros
    if (!isCashier) {
      setActiveShiftId(null);
      return;
    }
    try {
      const summary = await posService.getMyActiveShiftSummary();
      setActiveShiftId(summary.id);
    } catch {
      setActiveShiftId(null);
    }
  };

  const loadMovements = async () => {
    setIsLoading(true);
    try {
      const data = await posService.getMovements(page, size, undefined, true);
      setMovements(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (error) {
      toastError("Error al cargar los movimientos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!movementToDelete) return;
    try {
      await posService.deleteMovement(movementToDelete);
      toastSuccess("Movimiento eliminado exitosamente.");
      setMovementToDelete(null);
      loadMovements();
    } catch (error: any) {
      toastError(error.response?.data?.message || "Error al eliminar el movimiento.");
    }
  };

  const columns = [
    { 
      header: 'Hora', 
      render: (row: MovementResponse) => new Date(row.date).toLocaleTimeString() 
    },
    isOwner && { header: 'Sucursal', accessorKey: 'branchName' },
    (isOwner || isManager) && { header: 'Caja', accessorKey: 'cashRegisterName' },
    (isOwner || isManager) && { header: 'Empleado', accessorKey: 'employeeName' },
    { header: 'Tipo', render: (row: MovementResponse) => row.movementType.label },
    { header: 'Método', render: (row: MovementResponse) => row.paymentType.label },
    { header: 'Monto', render: (row: MovementResponse) => `${currency} ${row.amount.toFixed(2)}` },
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
    onPageSizeChange: (newSize) => {
      setSize(newSize);
      setPage(0);
    }
  };

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
          disabled={isCashier && !isOwner && !isManager && !activeShiftId}
          title={isCashier && !isOwner && !isManager && !activeShiftId ? "Debes tener un turno activo para crear movimientos" : ""}
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
          shiftId={(isOwner || isManager) ? undefined : (activeShiftId || undefined)}
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
