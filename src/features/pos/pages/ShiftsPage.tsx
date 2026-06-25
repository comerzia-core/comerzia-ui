import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { posService } from '../services/posService';
import type { ShiftSummaryResponse } from '../types/pos';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { BtnCreate, BtnSave } from '../../../components/ui/CrudButtons';
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
      if (isCashier) {
        try {
          const data = await posService.getMyActiveShiftSummary();
          setShifts([data]);
        } catch(err: any) {
          if (err.response?.status === 404 || err.response?.status === 400 || err.response?.data?.message?.includes("OPEN shift") || err.response?.data?.message?.includes("active shift")) {
            setShifts([]);
          } else {
            throw err;
          }
        }
      } else {
        const data = await posService.getAllActiveShiftSummaries();
        setShifts(data);
      }
    } catch (error) {
      toastError("Error al cargar los turnos activos");
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    isOwner && { header: 'Sucursal', accessorKey: 'branchName' },
    (isOwner || isManager) && { header: 'Caja', accessorKey: 'cashName' },
    (isOwner || isManager) && { header: 'Cajero', accessorKey: 'employeeName' },
    { 
      header: 'Apertura', 
      render: (row: ShiftSummaryResponse) => row.openedAt ? (isOwner ? new Date(row.openedAt).toLocaleString() : new Date(row.openedAt).toLocaleTimeString()) : '-' 
    },
    { header: 'Ingresos', render: (row: ShiftSummaryResponse) => `${currency} ${row.totalInflows.toFixed(2)}` },
    { header: 'Egresos', render: (row: ShiftSummaryResponse) => `${currency} ${row.totalOutflows.toFixed(2)}` },
    {
      header: 'Acciones',
      render: (row: ShiftSummaryResponse) => (
        <button 
          className="btn btn-sm btn-error btn-outline"
          onClick={() => setCloserShiftId(row.id)}
        >
          Arqueo y Cierre
        </button>
      )
    }
  ].filter(Boolean) as Column<ShiftSummaryResponse>[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Turnos y Arqueos</h1>
          <p className="text-base-content/60 mt-1">Gestión de aperturas y cierres de caja</p>
        </div>
        <BtnCreate 
          label="Abrir Turno" 
          onClick={() => setIsOpenerOpen(true)}
          disabled={isCashier && shifts.length > 0} // Un cajero no puede abrir otro si ya tiene uno
        />
      </div>

      <ComerziaTable 
        data={shifts}
        columns={columns}
        isLoading={isLoading}
        showRowNumbers={true}
      />

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
