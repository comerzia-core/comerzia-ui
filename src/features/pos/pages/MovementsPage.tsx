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

  useEffect(() => {
    loadActiveShift();
    loadMovements();
  }, [page, size]);

  const { userProfile } = useAuthStore();
  const isCashier = userProfile?.roles.includes('CASHIER');

  const loadActiveShift = async () => {
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
      const data = await posService.getMovements(page, size);
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

  const columns: Column<MovementResponse>[] = [
    { 
      header: 'Fecha', 
      render: (row) => new Date(row.date).toLocaleString() 
    },
    { header: 'Tipo', render: (row) => row.movementType.label },
    { header: 'Método', render: (row) => row.paymentType.label },
    { header: 'Monto', render: (row) => `$${row.amount.toFixed(2)}` },
    { header: 'Observación', accessorKey: 'observation' },
    {
      header: 'Acciones',
      className: 'w-24',
      render: (row) => (
        <CrudButtons 
          onEdit={() => {
            setMovementToEdit(row);
            setIsModalOpen(true);
          }}
          onDelete={() => setMovementToDelete(row.id)}
        />
      )
    }
  ];

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
          disabled={!activeShiftId}
          title={!activeShiftId ? "Debes tener un turno activo para crear movimientos" : ""}
        />
      </div>

      <ComerziaTable 
        data={movements}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
      />

      {activeShiftId && (
        <MovementModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadMovements}
          shiftId={activeShiftId}
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
