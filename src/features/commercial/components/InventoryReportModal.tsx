import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { InventoryResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { ClipboardList, Calendar, User, FileText, Image as ImageIcon } from 'lucide-react';
import { formatDateForUser } from '../../../utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string | null;
}

export const InventoryReportModal = ({ isOpen, onClose, inventoryId }: Props) => {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { error: toastError } = useToast();

  useEffect(() => {
    if (isOpen && inventoryId) {
      loadInventory(inventoryId);
    } else {
      setInventory(null);
    }
  }, [isOpen, inventoryId]);

  const loadInventory = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await commercialService.getInventoryById(id);
      setInventory(data);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Error al cargar el reporte de inventario.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: any) => {
    if (!status) return null;
    const label = typeof status === 'object' ? status.label : String(status);
    const code = typeof status === 'object' ? status.code : Number(status);
    const isApproved = code === 403 || label?.toLowerCase().includes('aprob');
    const isPending = code === 401 || label?.toLowerCase().includes('pend');
    return (
      <span className={`badge badge-sm font-semibold ${isApproved ? 'badge-success' : isPending ? 'badge-warning' : 'badge-info'}`}>
        {label}
      </span>
    );
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte de Inventario"
      size="lg"
      actions={
        <div className="flex flex-row justify-end w-full">
          <BtnCancel onClick={onClose} label="Cerrar" responsive={true} className="w-full sm:w-auto" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : inventory ? (
        <div className="space-y-6 pt-2">
          {/* Header Card */}
          <div className="bg-base-200/50 p-4 rounded-2xl border border-base-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">
                  Rubro: {inventory.segmentName || 'No especificado'}
                </h3>
                <p className="text-xs text-base-content/50 font-mono">ID: {inventory.id}</p>
              </div>
            </div>
            {getStatusBadge(inventory.statusType)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-base-100 rounded-xl border border-base-200 space-y-2">
              <div className="flex items-center gap-2 text-base-content/60 font-semibold text-xs uppercase tracking-wider">
                <Calendar size={16} className="text-primary" /> Fechas de Registro
              </div>
              {inventory.assignedAt && (
                <p className="text-xs">
                  Asignado: <strong className="text-base-content">{formatDateForUser(inventory.assignedAt)}</strong>
                </p>
              )}
              {inventory.uploadedAt ? (
                <p className="text-xs">
                  Cargado: <strong className="text-base-content">{formatDateForUser(inventory.uploadedAt)}</strong>
                </p>
              ) : (
                <p className="text-xs text-base-content/40 italic">Pendiente de carga</p>
              )}
            </div>

            <div className="p-4 bg-base-100 rounded-xl border border-base-200 space-y-2">
              <div className="flex items-center gap-2 text-base-content/60 font-semibold text-xs uppercase tracking-wider">
                <User size={16} className="text-primary" /> Responsables
              </div>
              {inventory.assignedEmployeeId && (
                <p className="text-xs">
                  Asignado a: <strong className="text-base-content">{inventory.assignedEmployeeId}</strong>
                </p>
              )}
              {inventory.approvedEmployeeId && (
                <p className="text-xs">
                  Aprobado por: <strong className="text-base-content">{inventory.approvedEmployeeId}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {(inventory.staffNotes || inventory.adminNotes) && (
            <div className="space-y-3">
              {inventory.staffNotes && (
                <div className="p-4 bg-base-100 rounded-xl border border-base-200 space-y-1">
                  <div className="flex items-center gap-2 text-base-content/70 font-semibold text-xs">
                    <FileText size={16} className="text-info" /> Notas del Personal
                  </div>
                  <p className="text-xs text-base-content/80 whitespace-pre-wrap">{inventory.staffNotes}</p>
                </div>
              )}
              {inventory.adminNotes && (
                <div className="p-4 bg-base-100 rounded-xl border border-base-200 space-y-1">
                  <div className="flex items-center gap-2 text-base-content/70 font-semibold text-xs">
                    <FileText size={16} className="text-success" /> Notas de Administración
                  </div>
                  <p className="text-xs text-base-content/80 whitespace-pre-wrap">{inventory.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Image */}
          {inventory.imageUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base-content/70 font-semibold text-xs">
                <ImageIcon size={16} className="text-primary" /> Evidencia Fotográfica
              </div>
              <div className="rounded-xl overflow-hidden border border-base-200 max-h-64 flex justify-center bg-base-200/30">
                <img src={inventory.imageUrl} alt="Evidencia de inventario" className="object-contain max-h-64" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-base-content/40 italic">
          No se encontró información para este inventario.
        </div>
      )}
    </ComerziaModal>
  );
};
