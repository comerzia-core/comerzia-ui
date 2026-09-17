import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { posService } from '../services/posService';
import type { CashRegisterResponse, ShiftResponse } from '../types/pos';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { useToast } from '../../../context/ToastContext';
import { BtnDetails, BtnReopen } from '../../../components/ui/CrudButtons';
import { ShiftDetailsModal } from '../components/ShiftDetailsModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { formatDateForUser } from '../../../utils/date';
import { History } from 'lucide-react';

interface Props {
  register?: CashRegisterResponse;
}

export const CashRegisterHistoryView = ({ register: propRegister }: Props) => {
  const { registerId } = useParams<{ registerId: string }>();

  const { error: toastError, success: toastSuccess } = useToast();
  
  const location = useLocation();
  const stateRegister = location.state?.register as CashRegisterResponse | undefined;
  const initialRegister = propRegister || stateRegister || null;

  const register = initialRegister;

  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftToReopen, setShiftToReopen] = useState<string | null>(null);

  // Cargar datos de la caja si se entra directamente por URL y no hay state
  useEffect(() => {
    if (!register && registerId) {
      toastError('No se encontró información de la caja en sesión. Por favor, ingrese desde el listado de cajas.');
    }
  }, [registerId, register]);

  const targetRegisterId = register?.id || registerId;

  useEffect(() => {
    if (targetRegisterId) {
      loadShifts(targetRegisterId);
    }
  }, [targetRegisterId, page, size]);

  const loadShifts = async (regId: string) => {
    setIsLoading(true);
    try {
      const data = await posService.getShiftsByCashRegister(regId, page, size);
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
    if (!shiftToReopen || !targetRegisterId) return;
    setIsLoading(true);
    try {
      await posService.reopenShift(shiftToReopen);
      toastSuccess("Turno reabierto exitosamente.");
      loadShifts(targetRegisterId);
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
    { header: 'Cajero', accessorKey: 'cashierName' },
    { header: 'Apertura', render: row => formatDateForUser(row.openedAt) },
    { header: 'Cierre', render: row => row.closedAt ? formatDateForUser(row.closedAt) : 'En curso' },
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

  if (!register) {
    return (
      <div className="space-y-4 w-full animate-fade-in">
        <div className="flex items-start gap-2.5">
          <History className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <h1 className="text-lg sm:text-2xl font-bold text-base-content">Caja no encontrada</h1>
        </div>
        <div className="card bg-base-100 p-8 text-center text-base-content/60 border border-base-200 shadow-xs">
          No se encontró la información de la caja registradora solicitada.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="flex items-start gap-2.5">
        <History className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
            Historial: {register.name}
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
            Turnos registrados en esta caja registradora
          </p>
        </div>
      </div>

      {/* VISTA DESKTOP: TABLA */}
      <div className="hidden md:block">
        <ComerziaTable
          data={shifts}
          columns={columns}
          isLoading={isLoading}
          pagination={pagination}
          showRowNumbers={true}
        />
      </div>

      {/* VISTA MOBILE: CARDS */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No hay turnos registrados para esta caja.
          </div>
        ) : (
          <div className="space-y-2.5">
            {shifts.map((shift) => (
              <div key={shift.id} className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-base-content block">
                      {shift.cashierName || 'Cajero no asignado'}
                    </span>
                    <span className="text-[10px] text-base-content/50 block mt-1">
                      Apertura: {formatDateForUser(shift.openedAt)}
                    </span>
                    <span className="text-[10px] text-base-content/50 block">
                      Cierre: {shift.closedAt ? formatDateForUser(shift.closedAt) : <strong className="text-success">En curso</strong>}
                    </span>
                  </div>
                  <span className={`badge badge-xs font-semibold ${shift.closedAt ? 'badge-neutral' : 'badge-success'}`}>
                    {shift.statusType.label}
                  </span>
                </div>

                <div className="pt-2 border-t border-base-200/60 flex items-center justify-end gap-2">
                  <BtnDetails 
                    onClick={() => setSelectedShiftId(shift.id)}
                    responsive={true}
                    className="flex-1 min-w-0"
                  />
                  {shift.closedAt && (
                    <BtnReopen 
                      onClick={() => setShiftToReopen(shift.id)}
                      responsive={true}
                      className="flex-1 min-w-0"
                    />
                  )}
                </div>
              </div>
            ))}
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
              Ant.
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
              Sig.
            </button>
          </div>
        )}
      </div>

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
