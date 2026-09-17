import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { posService } from '../services/posService';
import type { CashRegisterResponse, ShiftResponse } from '../types/pos';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useToast } from '../../../context/ToastContext';
import { ShiftDetailsModal } from '../components/ShiftDetailsModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { formatDateForUser } from '../../../utils/date';
import { 
  History, 
  Eye, 
  RotateCcw, 
  Calendar, 
  Clock, 
  User, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight 
} from 'lucide-react';

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

  // Estado del Menú Contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered?: boolean;
    shift: ShiftResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    shift: null
  });

  // Validar datos de la caja si se entra directamente por URL y no hay state
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

  const handleContextMenu = (e: React.MouseEvent, shift: ShiftResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      isCentered: false,
      shift
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, shift: ShiftResponse) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      isCentered: true,
      shift
    });
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
    { 
      header: 'Cierre', 
      render: row => row.closedAt ? (
        formatDateForUser(row.closedAt)
      ) : (
        <span className="badge badge-success badge-sm font-semibold">En curso</span>
      ) 
    },
    { 
      header: 'Estado', 
      render: row => (
        <StatusBadge
          statusName={row.statusType.label}
          statusCode={row.statusType.code}
        />
      ) 
    },
    { header: 'Observación', accessorKey: 'observation' }
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

      {/* VISTA DESKTOP: TABLA CON CLIC DERECHO */}
      <div className="hidden md:block">
        <ComerziaTable
          data={shifts}
          columns={columns}
          isLoading={isLoading}
          pagination={pagination}
          showRowNumbers={true}
          onRowContextMenu={handleContextMenu}
        />
      </div>

      {/* VISTA MOBILE: CARDS ESTANDARIZADAS CON SIMPLE TAP */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No hay turnos registrados para esta caja.
          </div>
        ) : (
          shifts.map((shift, index) => (
            <article
              key={shift.id}
              onClick={(e) => handleMobileCardTap(e, shift)}
              className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
            >
              {/* FILA SUPERIOR: NUMERACIÓN, CAJERO Y BADGE */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                    {page * size + index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                      {shift.cashierName || 'Cajero no asignado'}
                    </h3>
                    <p className="text-xs font-mono text-base-content/60 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <User size={12} className="text-primary/70 shrink-0" /> Cajero
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <StatusBadge
                    statusName={shift.statusType.label}
                    statusCode={shift.statusType.code}
                  />
                </div>
              </div>

              {/* DETALLES DE APERTURA Y CIERRE */}
              <div className="pl-[26px] space-y-1 text-xs text-base-content/70">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary/70 shrink-0" />
                  <span className="truncate">
                    Apertura: <strong className="font-medium text-base-content/80">{formatDateForUser(shift.openedAt)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className={shift.closedAt ? "text-primary/70 shrink-0" : "text-success animate-pulse shrink-0"} />
                  <span className="truncate">
                    Cierre: {shift.closedAt ? (
                      <strong className="font-medium text-base-content/80">{formatDateForUser(shift.closedAt)}</strong>
                    ) : (
                      <strong className="text-success font-semibold">En curso</strong>
                    )}
                  </span>
                </div>
                {shift.observation && (
                  <p className="text-[11px] italic text-base-content/60 mt-1 truncate">
                    "{shift.observation}"
                  </p>
                )}
              </div>
            </article>
          ))
        )}

        {/* PAGINACIÓN MOBILE ESTÁNDAR */}
        {totalElements > 0 && (
          <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span>Mostrar</span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span className="whitespace-nowrap">de {totalElements} registros</span>
              </div>
              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                Página {page + 1} de {Math.max(1, totalPages)}
              </span>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                aria-label="Primera página"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(0)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(Math.max(0, page - 1))}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(page + 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Última página"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(totalPages - 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* MENÚ CONTEXTUAL ESTANDARIZADO */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.shift && (
          <>
            <ContextMenuItem
              icon={Eye}
              label="Ver Reporte Completo"
              onClick={() => {
                if (contextMenu.shift) {
                  setSelectedShiftId(contextMenu.shift.id);
                }
              }}
            />
            {contextMenu.shift.closedAt && (
              <ContextMenuItem
                icon={RotateCcw}
                label="Reabrir Turno"
                onClick={() => {
                  if (contextMenu.shift) {
                    setShiftToReopen(contextMenu.shift.id);
                  }
                }}
              />
            )}
          </>
        )}
      </ComerziaContextMenu>

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
