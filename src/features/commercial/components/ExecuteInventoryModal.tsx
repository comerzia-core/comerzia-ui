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

export const ExecuteInventoryModal = ({ isOpen, onClose, inventory, onSuccess }: Props) => {
  const [staffNotes, setStaffNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen && inventory) {
      setStaffNotes(inventory.staffNotes || '');
      setImageUrl(inventory.imageUrl || '');
    }
  }, [isOpen, inventory]);

  const handleSaveDraft = async () => {
    if (!inventory) return;
    setIsSubmitting(true);
    try {
      await commercialService.saveInventoryDraft(inventory.id, {
        staffNotes,
        imageUrl: imageUrl || undefined
      });
      toastSuccess("Borrador guardado exitosamente.");
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al guardar borrador.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ejecutar Conteo: ${inventory?.segmentName}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="bg-info/10 text-info p-4 rounded-xl">
          En una implementación completa, aquí se mostraría una lista paginada de todas las variantes (o un input de escáner) del segmento <strong>{inventory?.segmentName}</strong> para ir ingresando las cantidades contadas. 
          <br/><br/>
          Por ahora, registraremos notas de campo y progreso como borrador.
        </div>

        <ComerziaTextarea
          label="Notas del Ejecutor"
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
        />

        <div className="flex flex-row items-center gap-2 mt-6 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel onClick={onClose} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          <button 
            type="button"
            className="btn btn-outline btn-md flex-1 sm:flex-none sm:w-auto min-w-0" 
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <span className="hidden sm:inline">Guardar </span>Borrador
          </button>
          <BtnSave 
            label="Enviar" 
            onClick={handleSaveDraft} 
            isLoading={isSubmitting} 
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
