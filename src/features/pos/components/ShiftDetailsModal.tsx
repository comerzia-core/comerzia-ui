import { useState, useEffect } from 'react';
import { posService } from '../services/posService';
import type { ShiftDetailResponse, MovementResponse } from '../types/pos';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { BtnCancel } from '../../../components/ui/CrudButtons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
}

export const ShiftDetailsModal = ({ isOpen, onClose, shiftId }: Props) => {
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';

  const [details, setDetails] = useState<ShiftDetailResponse[]>([]);
  const [movements, setMovements] = useState<MovementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && shiftId) {
      loadData();
    }
  }, [isOpen, shiftId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [detailsData, movementsData] = await Promise.all([
        posService.getShiftDetails(shiftId),
        posService.getMovements(0, 1000, shiftId)
      ]);
      setDetails(detailsData);
      setMovements(movementsData.content);
    } catch (err) {
      toastError("Error al cargar los detalles del turno.");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const detailsColumns: Column<ShiftDetailResponse>[] = [
    { header: 'Forma de Pago', render: row => row.paymentType.label },
    { header: 'Esperado (Sistema)', render: row => `${currency} ${row.expectedAmount.toFixed(2)}` },
    { header: 'Contado (Cajero)', render: row => `${currency} ${row.countedAmount.toFixed(2)}` },
    { 
      header: 'Diferencia', 
      render: row => {
        const isDiff = row.differenceAmount !== 0;
        return (
          <span className={`font-bold ${isDiff ? (row.differenceAmount > 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
            {currency} {row.differenceAmount.toFixed(2)}
          </span>
        );
      }
    }
  ];

  const movementColumns: Column<MovementResponse>[] = [
    { header: 'Hora', render: row => new Date(row.date).toLocaleTimeString() },
    { header: 'Tipo', render: row => row.movementType.label },
    { header: 'Forma de Pago', render: row => row.paymentType.label },
    { header: 'Monto', render: row => `${currency} ${row.amount.toFixed(2)}` },
    { header: 'Observación', accessorKey: 'observation' },
  ];

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle y Cuadre del Turno"
      size="xl"
      actions={<BtnCancel label="Cerrar" onClick={onClose} />}
    >
      <div className="space-y-6 pt-4">
        {/* Resumen del Cuadre */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg border-b pb-2">Cuadre del Turno</h3>
          {details.length === 0 && !isLoading ? (
            <p className="text-sm text-base-content/60 italic">El turno aún está abierto, no tiene cuadre final.</p>
          ) : (
            <ComerziaTable
              data={details}
              columns={detailsColumns}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Movimientos */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg border-b pb-2">Listado de Movimientos</h3>
          <ComerziaTable
            data={movements}
            columns={movementColumns}
            isLoading={isLoading}
            showRowNumbers={true}
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
