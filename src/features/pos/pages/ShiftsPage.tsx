import { useState } from 'react';
import {
  Clock, Eye, Monitor, RotateCcw, MapPin, User, TrendingUp, TrendingDown,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { usePermission } from '../../../hooks/usePermission';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { formatDateForUser } from '../../../utils/date';
import { OpenShiftModal } from '../components/OpenShiftModal';
import { CloseShiftModal } from '../components/CloseShiftModal';
import { ShiftDetailsModal } from '../components/ShiftDetailsModal';
import { useDailyShifts } from '../hooks/useDailyShifts';
import type { DailyShiftResponse } from '../types/pos';

export const ShiftsPage = () => {
  const { shifts, isLoading, isReopening, loadShifts, reopenShift, page, setPage, size, setSize,
    totalPages, totalElements } = useDailyShifts();
  const { can, canAny } = usePermission();
  const currency = useAuthStore(state => state.userProfile?.companySettings?.currencyCode) || 'BOB';
  const [isOpenerOpen, setIsOpenerOpen] = useState(false);
  const [closingShift, setClosingShift] = useState<DailyShiftResponse | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reopenId, setReopenId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ shift: DailyShiftResponse | null; x: number; y: number; isCentered: boolean }>(
    { shift: null, x: 0, y: 0, isCentered: false });

  const money = (value: number) => `${currency} ${Number(value).toFixed(2)}`;
  const openingDisabled = !can('POS_SHIFTS_MANAGE_ALL') && shifts.some(shift => shift.closeAllowed);
  const columns: Column<DailyShiftResponse>[] = [
    { header: 'Caja', accessorKey: 'cashName' },
    { header: 'Tienda', accessorKey: 'branchName' },
    { header: 'Cajero', accessorKey: 'employeeName' },
    { header: 'Apertura', render: shift => formatDateForUser(shift.openedAt) },
    { header: 'Estado', render: shift => <StatusBadge statusCode={shift.statusType.code} statusName={shift.statusType.label} /> },
    { header: 'Ingresos', render: shift => money(shift.totalInflows) },
    { header: 'Salidas', render: shift => money(shift.totalOutflows) },
  ];

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Monitor className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Turnos y Arqueos</h1>
            <p className="text-xs sm:text-sm text-base-content/60">Aperturas y cierres de hoy, según el horario de tu empresa.</p>
          </div>
        </div>
        {canAny(['POS_SHIFTS_MANAGE_OWN', 'POS_SHIFTS_MANAGE_ALL']) && (
          <BtnCreate label="Abrir turno" onClick={() => setIsOpenerOpen(true)} className="w-full sm:w-auto"
            disabled={openingDisabled} title={openingDisabled ? 'Ya tienes un turno abierto' : undefined} />
        )}
      </div>

      <div className="hidden md:block card bg-base-100 border border-base-200 rounded-2xl overflow-hidden">
        <ComerziaTable data={shifts} columns={columns} isLoading={isLoading} showRowNumbers
          pagination={{ currentPage: page, pageSize: size, totalPages, totalElements, onPageChange: setPage, onPageSizeChange: setSize }}
          onRowContextMenu={(event, shift) => {
            event.preventDefault();
            setMenu({ shift, x: event.clientX, y: event.clientY, isCentered: false });
          }} />
      </div>
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-2xl text-xs">
            No se encontraron turnos de hoy.
          </div>
        ) : (
          shifts.map((shift) => (
            <article
              key={shift.id}
              onClick={(e) => {
                e.stopPropagation();
                setMenu({ shift, x: 0, y: 0, isCentered: true });
              }}
              className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-3 select-none cursor-pointer hover:border-primary/40 hover:shadow-sm"
            >
              {/* CABECERA DE LA TARJETA: ICONO DE CAJA + NOMBRE Y BADGE */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center shrink-0 shadow-xs">
                  <Monitor size={22} className="stroke-[2.2]" />
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <h2 className="font-black text-sm sm:text-base text-base-content uppercase tracking-tight truncate">
                    {shift.cashName}
                  </h2>
                  <div>
                    <StatusBadge
                      statusCode={shift.statusType.code}
                      statusName={shift.statusType.label}
                      className="badge-xs sm:badge-sm font-bold text-[10px] uppercase tracking-wider rounded-md h-5 px-2"
                    />
                  </div>
                </div>
              </div>

              {/* INFORMACIÓN DESCRIPTIVA: SUCURSAL, CAJERO Y HORARIO */}
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-2 text-base-content/80 font-semibold tracking-wide uppercase truncate">
                  <MapPin size={15} className="text-base-content/50 shrink-0" />
                  <span className="truncate">{shift.branchName}</span>
                </div>
                <div className="flex items-center gap-2 text-base-content/80 font-medium truncate">
                  <User size={15} className="text-base-content/50 shrink-0" />
                  <span className="truncate">{shift.employeeName}</span>
                </div>
                <div className="flex items-center gap-2 text-base-content/70">
                  <Clock size={15} className="text-base-content/50 shrink-0" />
                  <span className="truncate">Apertura: {formatDateForUser(shift.openedAt)}</span>
                </div>
              </div>

              {/* TOTALES DE INGRESOS Y GASTOS */}
              <div className="border-t border-base-200/80 pt-3 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-base-content/60">
                    <TrendingUp size={14} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                    <span>Ingresos</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
                    {money(shift.totalInflows)}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-base-content/60">
                    <TrendingDown size={14} className="text-rose-500 shrink-0 stroke-[2.5]" />
                    <span>Gastos</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-rose-500 dark:text-rose-400 tracking-tight truncate">
                    {money(shift.totalOutflows)}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}

        {totalElements > 0 && (
          <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
            {/* Cantidad y resumen de página */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span>Mostrar</span>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="whitespace-nowrap">de {totalElements} registros</span>
              </div>
              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                Página {page + 1} de {Math.max(1, totalPages)}
              </span>
            </div>

            {/* Controles de navegación */}
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

      <ComerziaContextMenu isOpen={Boolean(menu.shift)} x={menu.x} y={menu.y} isCentered={menu.isCentered}
        onClose={() => setMenu(previous => ({ ...previous, shift: null }))}>
        {menu.shift && <>
          <ContextMenuItem icon={Eye} label="Ver reporte" onClick={() => setReportId(menu.shift!.id)} />
          {menu.shift.closeAllowed && canAny(['POS_SHIFTS_MANAGE_OWN', 'POS_SHIFTS_MANAGE_ALL']) && (
            <ContextMenuItem icon={Clock} label="Arqueo y cierre" onClick={() => setClosingShift(menu.shift)} />
          )}
          {menu.shift.reopenAllowed && can('POS_SHIFTS_REOPEN') && (
            <ContextMenuItem icon={RotateCcw} label="Reabrir turno" onClick={() => setReopenId(menu.shift!.id)} />
          )}
        </>}
      </ComerziaContextMenu>
      {isOpenerOpen && <OpenShiftModal isOpen onClose={() => setIsOpenerOpen(false)} onSuccess={() => { void loadShifts(true); }} />}
      {closingShift && <CloseShiftModal isOpen onClose={() => setClosingShift(null)} shiftId={closingShift.id}
        shiftSummary={closingShift} onSuccess={() => { void loadShifts(true); }} />}
      {reportId && <ShiftDetailsModal isOpen shiftId={reportId} onClose={() => setReportId(null)} />}
      <ConfirmationModal isOpen={Boolean(reopenId)} onClose={() => setReopenId(null)} title="Reabrir turno"
        message="Se habilitarán nuevos movimientos y deberás realizar otro arqueo al cerrar." confirmText="Reabrir"
        variant="warning" isLoading={isReopening} onConfirm={() => {
          if (reopenId) void reopenShift(reopenId).finally(() => setReopenId(null));
        }} />
    </div>
  );
};
