import { useState, useEffect } from 'react';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { posService } from '../services/posService';
import { branchService } from '../../organization/services/branchService';
import type { MovementResponse } from '../types/pos';
import type { BranchResponse } from '../../organization/types/branch';
import { useToast } from '../../../context/ToastContext';
import { MovementModal } from '../components/MovementModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import {
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  User,
  Monitor,
  Building2,
  ArrowLeftRight
} from 'lucide-react';
import { formatDateForUser } from '../../../utils/date';

export const MovementsPage = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [movements, setMovements] = useState<MovementResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Paginación
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Turno activo
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<MovementResponse | null>(null);
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null);

  // Menú contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered?: boolean;
    row: MovementResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    row: null
  });

  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];
  const isOwner = roles.includes('OWNER');
  const isManager = roles.includes('BRANCH_MANAGER');
  const isCashier = roles.includes('CASHIER');

  const currency = userProfile?.companySettings?.currencyCode || '$';

  useEffect(() => {
    loadActiveShift();
    if (isOwner) {
      loadBranches();
    }
  }, [isOwner]);

  useEffect(() => {
    loadMovements();
  }, [page, size]);

  const loadBranches = async () => {
    try {
      const data = await branchService.getBranches(0, 100, true);
      setBranches(data.content || []);
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

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

  const handleContextMenu = (e: React.MouseEvent, row: MovementResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      isCentered: false,
      row
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, row: MovementResponse) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      isCentered: true,
      row
    });
  };

  // Filtrado reactivo de movimientos
  const filteredMovements = movements.filter(mov => {
    const matchesSearch =
      search === '' ||
      (mov.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (mov.observation || '').toLowerCase().includes(search.toLowerCase()) ||
      (mov.movementType?.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (mov.cashRegisterName || '').toLowerCase().includes(search.toLowerCase());

    const matchesBranch = selectedBranch === '' || mov.branchName === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  const branchOptions = [
    { value: '', label: 'Todas las sucursales' },
    ...branches.map(b => ({ value: b.name, label: b.name }))
  ];

  const columns = [
    {
      header: 'Fecha / Hora',
      render: (row: MovementResponse) => (
        <span className="text-xs font-medium text-base-content/80">
          {formatDateForUser(row.date)}
        </span>
      )
    },
    isOwner && {
      header: 'Sucursal',
      render: (row: MovementResponse) => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/80">
          <Building2 size={13} className="text-primary/70 shrink-0" />
          <span className="truncate">{row.branchName || 'Sin sucursal'}</span>
        </div>
      )
    },
    (isOwner || isManager) && {
      header: 'Caja',
      render: (row: MovementResponse) => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/80">
          <Monitor size={13} className="text-primary/70 shrink-0" />
          <span className="truncate">{row.cashRegisterName || '-'}</span>
        </div>
      )
    },
    (isOwner || isManager) && {
      header: 'Empleado',
      render: (row: MovementResponse) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-base-content">
          <User size={13} className="text-primary/70 shrink-0" />
          <span className="truncate">{row.employeeName || '-'}</span>
        </div>
      )
    },
    {
      header: 'Tipo',
      render: (row: MovementResponse) => {
        const isIncome = row.movementType?.label?.toLowerCase().includes('ingreso') || row.movementType?.code === 1;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
            isIncome ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          }`}>
            {isIncome ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            {row.movementType?.label || '-'}
          </span>
        );
      }
    },
    {
      header: 'Método',
      render: (row: MovementResponse) => (
        <span className="text-xs text-base-content/70">{row.paymentType?.label || '-'}</span>
      )
    },
    {
      header: 'Monto',
      render: (row: MovementResponse) => {
        const isIncome = row.movementType?.label?.toLowerCase().includes('ingreso') || row.movementType?.code === 1;
        return (
          <span className={`font-mono font-bold text-xs sm:text-sm ${isIncome ? 'text-success' : 'text-error'}`}>
            {isIncome ? '+' : '-'}{currency} {row.amount ? row.amount.toFixed(2) : '0.00'}
          </span>
        );
      }
    },
    {
      header: 'Observación',
      render: (row: MovementResponse) => (
        <span className="text-xs text-base-content/60 italic truncate max-w-[200px] block" title={row.observation || ''}>
          {row.observation ? row.observation : <span className="text-xs text-base-content/40 italic">(sin observación)</span>}
        </span>
      )
    }
  ].filter(Boolean) as Column<MovementResponse>[];

  const paginationConfig: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements: totalElements,
    totalPages: totalPages,
    onPageChange: setPage,
    onPageSizeChange: newSize => {
      setSize(newSize);
      setPage(0);
    }
  };

  const isCreateDisabled = !isCashier || !activeShiftId;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-2.5">
          <ArrowLeftRight className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Movimientos de Caja
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Registro y control de ingresos y egresos manuales de efectivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BtnCreate
            label="Nuevo Movimiento"
            onClick={() => {
              setMovementToEdit(null);
              setIsModalOpen(true);
            }}
            disabled={isCreateDisabled}
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
      </div>

      {/* BARRA DE FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por empleado u observación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filtro por Sucursal solo para OWNER */}
          {isOwner && (
            <div className="flex items-center gap-2 w-full sm:w-72">
              <Building2 size={18} className="text-primary shrink-0" />
              <ComerziaSelect
                label=""
                options={branchOptions}
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA PRINCIPAL (DESKTOP) */}
      <div className="md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:card-body md:p-0">
          <div className="hidden md:block">
            <ComerziaTable
              data={filteredMovements}
              columns={columns}
              isLoading={isLoading}
              pagination={paginationConfig}
              showRowNumbers={true}
              onRowContextMenu={(e, row) => handleContextMenu(e, row)}
            />
          </div>
        </div>
      </div>

      {/* VISTA MOBILE: CARDS */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron movimientos de caja.
          </div>
        ) : (
          filteredMovements.map((mov, index) => {
            const isIncome = mov.movementType?.label?.toLowerCase().includes('ingreso') || mov.movementType?.code === 1;
            return (
              <article
                key={mov.id}
                onClick={(e) => handleMobileCardTap(e, mov)}
                className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
              >
                {/* FILA SUPERIOR: NUMERACIÓN, TIPO Y MONTO */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                      {page * size + index + 1}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isIncome ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {isIncome ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                          {mov.movementType?.label || 'Movimiento'}
                        </h3>
                        <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5 truncate">
                          <span>{mov.paymentType?.label || 'Efectivo'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <span className={`text-sm sm:text-base font-bold font-mono shrink-0 ${isIncome ? 'text-success' : 'text-error'}`}>
                    {isIncome ? '+' : '-'}{currency} {mov.amount ? mov.amount.toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* DETALLES DE EMPLEADO / CAJA / SUCURSAL CON SANGRÍA */}
                {(isOwner || isManager || mov.employeeName) && (
                  <div className="pl-[26px] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/70">
                    {mov.employeeName && (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <User size={12} className="text-primary/70 shrink-0" />
                        <span className="truncate">{mov.employeeName}</span>
                      </span>
                    )}
                    {mov.cashRegisterName && (
                      <span className="inline-flex items-center gap-1 text-base-content/60">
                        <Monitor size={12} className="text-primary/70 shrink-0" />
                        <span className="truncate">{mov.cashRegisterName}</span>
                      </span>
                    )}
                    {isOwner && mov.branchName && (
                      <span className="inline-flex items-center gap-1 text-base-content/60">
                        <Building2 size={12} className="text-primary/70 shrink-0" />
                        <span className="truncate">{mov.branchName}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* OBSERVACIÓN */}
                <div className="pl-[26px]">
                  {mov.observation ? (
                    <p className="text-base-content/70 italic bg-base-200/50 px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed">
                      "{mov.observation}"
                    </p>
                  ) : (
                    <p className="text-base-content/40 italic text-[11px]">
                      (sin observación)
                    </p>
                  )}
                </div>

                {/* PIE DE TARJETA: FECHA */}
                <div className="pl-[26px] pt-1.5 border-t border-base-100 flex items-center text-[11px] text-base-content/60">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-base-content/40 shrink-0" />
                  <span>
                    Fecha: <strong className="font-medium text-base-content/80">{formatDateForUser(mov.date)}</strong>
                  </span>
                </div>
              </article>
            );
          })
        )}

        {/* PAGINACIÓN MOBILE EN UNA SOLA FILA */}
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

      {/* MENÚ CONTEXTUAL */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.row && (
          <>
            <ContextMenuItem
              icon={Edit}
              label="Modificar Movimiento"
              onClick={() => {
                if (contextMenu.row) {
                  setMovementToEdit(contextMenu.row);
                  setIsModalOpen(true);
                }
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
