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
      actions={
        <div className="flex flex-row justify-end w-full">
          <BtnCancel label="Cerrar" onClick={onClose} responsive={true} className="w-full sm:w-auto" />
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        {/* Resumen del Cuadre */}
        <div className="space-y-3">
          <h3 className="font-bold text-base sm:text-lg border-b border-base-200 pb-2">Cuadre del Turno</h3>
          {details.length === 0 && !isLoading ? (
            <p className="text-xs sm:text-sm text-base-content/60 italic">El turno aún está abierto, no tiene cuadre final.</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <ComerziaTable
                  data={details}
                  columns={detailsColumns}
                  isLoading={isLoading}
                />
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden space-y-2">
                {details.map((d, idx) => {
                  const isDiff = d.differenceAmount !== 0;
                  return (
                    <div key={idx} className="bg-base-100 p-3 rounded-xl border border-base-200 shadow-xs space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span>{d.paymentType.label}</span>
                        <span className={isDiff ? (d.differenceAmount > 0 ? 'text-success' : 'text-error') : 'text-base-content'}>
                          Dif: {currency} {d.differenceAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-base-content/60 pt-1 border-t border-base-200/50">
                        <span>Sistema: {currency} {d.expectedAmount.toFixed(2)}</span>
                        <span>Contado: {currency} {d.countedAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Movimientos */}
        <div className="space-y-3">
          <h3 className="font-bold text-base sm:text-lg border-b border-base-200 pb-2">Listado de Movimientos</h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block">
            <ComerziaTable
              data={movements}
              columns={movementColumns}
              isLoading={isLoading}
              showRowNumbers={true}
            />
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden space-y-2">
            {isLoading ? (
              <div className="py-6 text-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : movements.length === 0 ? (
              <p className="text-xs text-base-content/50 italic py-4 text-center">Sin movimientos registrados en este turno.</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="bg-base-100 p-3 rounded-xl border border-base-200 shadow-xs space-y-1 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-base-content">{m.movementType.label}</span>
                      <span className="text-[10px] text-base-content/50 block">{m.paymentType.label} • {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="font-bold font-mono text-sm">
                      {currency} {m.amount.toFixed(2)}
                    </span>
                  </div>
                  {m.observation && (
                    <p className="text-[10px] text-base-content/60 italic mt-0.5">"{m.observation}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ComerziaModal>
  );
};
