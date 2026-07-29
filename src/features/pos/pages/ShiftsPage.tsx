// src/features/pos/pages/ShiftsPage.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { posService } from '../services/posService';
import type { ShiftSummaryResponse } from '../types/pos';
import { BtnCreate, BtnCloseShift } from '../../../components/ui/CrudButtons';
import { Monitor, User, MapPin, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { OpenShiftModal } from '../components/OpenShiftModal';
import { CloseShiftModal } from '../components/CloseShiftModal';
import { useToast } from '../../../context/ToastContext';

export const ShiftsPage = () => {
  const { userProfile } = useAuthStore();
  const isCashier = userProfile?.roles.includes('CASHIER');
  const { error: toastError } = useToast();

  const [shifts, setShifts] = useState<ShiftSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isOpenerOpen, setIsOpenerOpen] = useState(false);
  const [closerShiftId, setCloserShiftId] = useState<string | null>(null);

  const roles = userProfile?.roles || [];
  const isOwner = roles.includes('OWNER');
  const isManager = roles.includes('BRANCH_MANAGER');

  const currency = userProfile?.companySettings?.currencyCode || '$';

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      if (isOwner || isManager) {
        const data = await posService.getAllActiveShiftSummaries();
        setShifts(data || []);
      } else if (isCashier) {
        try {
          const data = await posService.getMyActiveShiftSummary();
          setShifts(data ? [data] : []);
        } catch (err: any) {
          // Silenciosamente capturamos sin toast info
          setShifts([]);
        }
      }
    } catch (error) {
      console.error('Error loading active shifts:', error);
      toastError('No se pudieron cargar los turnos activos.');
    } finally {
      setIsLoading(false);
    }
  };

  const isOpenerDisabled = isCashier && !isOwner && !isManager && shifts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Turnos y Arqueos</h1>
          <p className="text-base-content/60 mt-1">Gestión de aperturas y cierres de caja</p>
        </div>
        <BtnCreate
          label="Abrir Turno"
          onClick={() => setIsOpenerOpen(true)}
          disabled={isOpenerDisabled}
          title={isOpenerDisabled ? 'Ya tienes un turno activo abierto' : undefined}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-base-100 rounded-2xl p-8 text-center shadow-sm border border-base-200">
          <p className="text-base-content/60 text-lg">No hay turnos activos actualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map(shift => (
            <div
              key={shift.id}
              className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200 flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-base-content truncate max-w-[150px]" title={shift.cashName}>
                      {shift.cashName}
                    </h3>
                    <span className="badge badge-success badge-sm">EN CURSO</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {isOwner && (
                  <div className="flex items-center gap-2 text-sm text-base-content/70">
                    <MapPin size={16} className="shrink-0" />
                    <span className="truncate" title={shift.branchName}>
                      {shift.branchName}
                    </span>
                  </div>
                )}
                {(isOwner || isManager) && (
                  <div className="flex items-center gap-2 text-sm text-base-content/70">
                    <User size={16} className="shrink-0" />
                    <span className="truncate" title={shift.employeeName}>
                      {shift.employeeName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <Clock size={16} className="shrink-0" />
                  <span>Apertura: {shift.openedAt ? new Date(shift.openedAt).toLocaleTimeString() : '-'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-base-200">
                  <div>
                    <p className="text-xs text-base-content/50 font-medium mb-1 flex items-center gap-1">
                      <TrendingUp size={12} className="text-success" /> Ingresos
                    </p>
                    <p className="text-sm font-bold text-success">
                      {currency} {shift.totalInflows ? shift.totalInflows.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 font-medium mb-1 flex items-center gap-1">
                      <TrendingDown size={12} className="text-error" /> Egresos
                    </p>
                    <p className="text-sm font-bold text-error">
                      {currency} {shift.totalOutflows ? shift.totalOutflows.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              <BtnCloseShift onClick={() => setCloserShiftId(shift.id)} fullWidth />
            </div>
          ))}
        </div>
      )}

      <OpenShiftModal
        isOpen={isOpenerOpen}
        onClose={() => setIsOpenerOpen(false)}
        onSuccess={loadShifts}
      />

      <CloseShiftModal
        isOpen={!!closerShiftId}
        onClose={() => setCloserShiftId(null)}
        shiftId={closerShiftId}
        onSuccess={loadShifts}
      />
    </div>
  );
};
