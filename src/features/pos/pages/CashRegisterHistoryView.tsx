import { useState, useEffect } from 'react';
import { posService } from '../services/posService';
import type { CashRegisterResponse, ShiftResponse } from '../types/pos';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { useToast } from '../../../context/ToastContext';
import { BtnBack } from '../../../components/ui/CrudButtons';
import { ShiftDetailsModal } from '../components/ShiftDetailsModal';
import { useAuthStore } from '../../../stores/useAuthStore';

interface Props {
  register: CashRegisterResponse;
  onBack: () => void;
}

export const CashRegisterHistoryView = ({ register, onBack }: Props) => {
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';
  
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

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
        <button 
          className="btn btn-sm btn-outline btn-primary"
          onClick={() => setSelectedShiftId(row.id)}
        >
          Ver Detalles
        </button>
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
    </div>
  );
};
