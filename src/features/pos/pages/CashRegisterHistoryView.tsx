import { useState, useEffect } from 'react';
import { posService } from '../services/posService';
import type { CashRegisterResponse, ShiftResponse } from '../types/pos';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { useToast } from '../../../context/ToastContext';
import { BtnBack, BtnDetails, BtnReopen } from '../../../components/ui/CrudButtons';
import { ShiftDetailsModal } from '../components/ShiftDetailsModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

interface Props {
  register: CashRegisterResponse;
  onBack: () => void;
}

export const CashRegisterHistoryView = ({ register, onBack }: Props) => {
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';
  
  const { error: toastError, success: toastSuccess } = useToast();
  
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftToReopen, setShiftToReopen] = useState<string | null>(null);

  useEffect(() => {
    loadShifts();
  }, [register.id, page, size]);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const data = await posService.getShiftsByCashRegister(register.id, page, size);
      setShifts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      toastError("Error al cargar el historial de turnos de la caja.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!shiftToReopen) return;
    setIsLoading(true);
    try {
      await posService.reopenShift(shiftToReopen);
      toastSuccess("Turno reabierto exitosamente.");
      loadShifts();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Error al reabrir el turno.");
    } finally {
      setIsLoading(false);
      setShiftToReopen(null);
    }
  };

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages,
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  const columns: Column<ShiftResponse>[] = [
    { header: 'Apertura', render: row => new Date(row.openedAt).toLocaleString() },
    { header: 'Cierre', render: row => row.closedAt ? new Date(row.closedAt).toLocaleString() : 'En curso' },
    { header: 'Monto Inicial', render: row => `${currency} ${row.initialAmount.toFixed(2)}` },
    { header: 'Estado', render: row => row.statusType.label },
    { 
      header: 'Acciones', 
      render: row => (
        <div className="flex gap-2">
          <BtnDetails 
            onClick={() => setSelectedShiftId(row.id)}
            className="btn-sm min-h-0 h-9"
          />
          {row.closedAt && (
            <BtnReopen 
              onClick={() => setShiftToReopen(row.id)}
              className="btn-sm min-h-0 h-9"
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <BtnBack onClick={onBack} />
        <div>
          <h2 className="text-2xl font-bold text-base-content">Historial: {register.name}</h2>
          <p className="text-base-content/60 text-sm">Turnos registrados en esta máquina</p>
        </div>
      </div>

      <ComerziaTable
        data={shifts}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
        showRowNumbers={true}
      />

      {selectedShiftId && (
        <ShiftDetailsModal
          isOpen={!!selectedShiftId}
          onClose={() => setSelectedShiftId(null)}
          shiftId={selectedShiftId}
        />
      )}

      <ConfirmationModal
        isOpen={!!shiftToReopen}
        onClose={() => setShiftToReopen(null)}
        onConfirm={handleReopen}
        title="Reabrir Turno"
        message="¿Estás seguro que deseas reabrir este turno? Volverá a estar activo y el cajero asignado podrá registrar nuevos movimientos o ventas."
        confirmText="Sí, Reabrir"
        cancelText="Cancelar"
      />
    </div>
  );
};
