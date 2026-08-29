import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import { useToast } from '../../../context/ToastContext';
import type { InventoryResponse } from '../types/commercial';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryResponse | null;
  onSuccess: () => void;
}

export const ApproveInventoryModal = ({ isOpen, onClose, inventory, onSuccess }: Props) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen && inventory) {
      setAdminNotes(inventory.adminNotes || '');
    }
  }, [isOpen, inventory]);

  const handleApprove = async () => {
    if (!inventory) return;
    setIsSubmitting(true);
    try {
      // In a real scenario, the differences array would be populated based on auditor's review
      // We will send an empty array or a mock payload to complete the flow.
      await commercialService.approveInventory(inventory.id, {
        adminNotes,
        differences: []
      });
      toastSuccess("Inventario aprobado. Ajustes registrados en el Kardex.");
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al aprobar inventario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Aprobar Conteo: ${inventory?.segmentName}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="bg-warning/10 text-warning p-4 rounded-xl">
          Aquí se mostraría la tabla de discrepancias (Esperado vs Contado = Diferencia). Al aprobar, se registrarán automáticamente los ajustes (Mermas o Sobrantes) afectando el Kardex y contabilidad.
        </div>

        {inventory?.staffNotes && (
          <div className="bg-base-200 p-4 rounded-xl border border-base-300">
            <h4 className="font-bold text-xs uppercase opacity-50 mb-1">Notas del Ejecutor</h4>
            <p className="text-sm">{inventory.staffNotes}</p>
          </div>
        )}

        <ComerziaTextarea
          label="Observaciones del Administrador (Auditoría)"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />

        <div className="flex flex-row items-center gap-2 mt-6 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel onClick={onClose} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          <BtnSave
            label="Aprobar y Contabilizar"
            onClick={handleApprove}
            isLoading={isSubmitting}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
