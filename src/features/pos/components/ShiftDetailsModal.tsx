import { useState, useEffect } from 'react';
import { posService } from '../services/posService';
import type { ShiftCompleteReportResponse, MovementResponse, ShiftPaymentReport } from '../types/pos';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import { formatDateForUser } from '../../../utils/date';
import { User, Building2, Monitor, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
}

export const ShiftDetailsModal = ({ isOpen, onClose, shiftId }: Props) => {
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currency = userProfile?.companySettings?.currencyCode || '$';

  const [report, setReport] = useState<ShiftCompleteReportResponse | null>(null);
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
      setReport(detailsData);
      setMovements(movementsData.content);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toastError("El turno solicitado no fue encontrado.");
      } else {
        toastError("Error al cargar los detalles del turno.");
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const paymentColumns: Column<ShiftPaymentReport>[] = [
    { header: 'Forma de Pago', render: row => row.paymentType.label },
    { header: 'Ventas', render: row => `${currency} ${row.salesAmount.toFixed(2)}` },
    { header: 'Devoluciones', render: row => `${currency} ${row.returnsAmount.toFixed(2)}` },
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
    { header: 'Fecha / Hora', render: row => formatDateForUser(row.date) },
    { header: 'Tipo', render: row => row.movementType.label },
    { header: 'Forma de Pago', render: row => row.paymentType.label },
    { header: 'Monto', render: row => `${currency} ${row.amount.toFixed(2)}` },
    { header: 'Observación', accessorKey: 'observation' },
  ];

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte Completo del Turno"
      size="xl"
      actions={
        <div className="flex flex-row justify-end w-full">
          <BtnCancel label="Cerrar" onClick={onClose} responsive={false} className="w-full sm:w-auto" />
        </div>
      }
    >
      {isLoading || !report ? (
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="space-y-6 pt-2 w-full animate-fade-in">
          
          {/* SECCIÓN 1: CONTEXTO GENERAL Y ESTADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contexto */}
            <div className="bg-base-200/50 p-4 rounded-2xl border border-base-200 space-y-3">
              <h3 className="font-bold text-sm text-base-content/70 uppercase tracking-wider">Contexto del Turno</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Caja:</span>
                  <span className="font-bold text-base-content truncate">{report.cashRegisterName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Sucursal:</span>
                  <span className="text-base-content/80 truncate">{report.branchName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Cajero:</span>
                  <span className="text-base-content/80 truncate">{report.cashierName}</span>
                </div>
                {report.closedByName && (
                  <div className="flex items-center gap-2 pt-1 border-t border-base-200/50">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <span className="font-medium text-base-content w-20 shrink-0">Cerrado:</span>
                    <span className="text-base-content/80 truncate">{report.closedByName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tiempos y Estado */}
            <div className="bg-base-200/50 p-4 rounded-2xl border border-base-200 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-base-content/70 uppercase tracking-wider">Estado y Tiempos</h3>
                <span className={`badge font-bold ${report.closedAt ? 'badge-neutral' : 'badge-success'}`}>
                  {report.statusType.label}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-base-content w-20 shrink-0">Apertura:</span>
                  <span className="font-bold text-base-content truncate">{formatDateForUser(report.openedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className={report.closedAt ? "text-primary shrink-0" : "text-success animate-pulse shrink-0"} />
                  <span className="font-medium text-base-content w-20 shrink-0">Cierre:</span>
                  <span className="text-base-content/80 truncate">
                    {report.closedAt ? formatDateForUser(report.closedAt) : 'En curso'}
                  </span>
                </div>
                {report.observation && (
                  <div className="mt-2 pt-2 border-t border-base-300">
                    <span className="block text-xs font-semibold text-base-content/60 mb-1">Observaciones de Cierre:</span>
                    <p className="text-sm italic text-base-content/80 bg-base-100 p-2 rounded-lg border border-base-200">
                      "{report.observation}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TOTALES GLOBALES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-1">Monto Inicial</span>
              <span className="text-xl sm:text-2xl font-bold text-primary font-mono">{currency} {report.initialAmount.toFixed(2)}</span>
            </div>
            <div className="bg-success/5 border border-success/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-success/70 uppercase tracking-wider mb-1">Total Ingresos</span>
              <span className="text-xl sm:text-2xl font-bold text-success font-mono">{currency} {report.totalInflows.toFixed(2)}</span>
            </div>
            <div className="bg-error/5 border border-error/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-error/70 uppercase tracking-wider mb-1">Total Egresos</span>
              <span className="text-xl sm:text-2xl font-bold text-error font-mono">{currency} {report.totalOutflows.toFixed(2)}</span>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLE POR MÉTODO DE PAGO */}
          <div className="space-y-3">
            <h3 className="font-bold text-base sm:text-lg border-b border-base-200 pb-2 text-base-content">
              Cuadre por Método de Pago
            </h3>
            {report.paymentReports.length === 0 ? (
              <p className="text-xs sm:text-sm text-base-content/60 italic">El turno aún está abierto o no tiene cuadre final.</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <ComerziaTable
                    data={report.paymentReports.map((p, index) => ({ ...p, id: index }))}
                    columns={paymentColumns}
                  />
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden space-y-2">
                  {report.paymentReports.map((p, idx) => {
                    const isDiff = p.differenceAmount !== 0;
                    return (
                      <div key={idx} className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
                        <div className="flex justify-between items-center font-bold pb-1 border-b border-base-200/50">
                          <span className="text-sm">{p.paymentType.label}</span>
                          <span className={`text-sm ${isDiff ? (p.differenceAmount > 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
                            Dif: {currency} {p.differenceAmount.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-base-200/40 p-1.5 rounded-lg flex justify-between">
                            <span className="text-base-content/60">Ventas:</span>
                            <span className="font-semibold">{currency} {p.salesAmount.toFixed(2)}</span>
                          </div>
                          <div className="bg-base-200/40 p-1.5 rounded-lg flex justify-between">
                            <span className="text-base-content/60">Devoluciones:</span>
                            <span className="font-semibold text-error">{currency} {p.returnsAmount.toFixed(2)}</span>
                          </div>
                          <div className="bg-primary/5 p-1.5 rounded-lg flex justify-between text-primary">
                            <span className="opacity-70">Sistema:</span>
                            <span className="font-bold">{currency} {p.expectedAmount.toFixed(2)}</span>
                          </div>
                          <div className="bg-success/5 p-1.5 rounded-lg flex justify-between text-success">
                            <span className="opacity-70">Contado:</span>
                            <span className="font-bold">{currency} {p.countedAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* SECCIÓN 4: LISTADO DE MOVIMIENTOS */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-base sm:text-lg border-b border-base-200 pb-2 text-base-content">
              Listado de Movimientos (Ingresos/Egresos)
            </h3>
            
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
                        <span className="text-[10px] text-base-content/50 block">{m.paymentType.label} • {formatDateForUser(m.date)}</span>
                      </div>
                      <span className="font-bold font-mono text-sm">
                        {currency} {m.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-base-content/60 italic mt-0.5">
                      {m.observation ? `"${m.observation}"` : <span className="text-base-content/40">(sin observación)</span>}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </ComerziaModal>
  );
};
