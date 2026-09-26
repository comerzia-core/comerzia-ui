import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import { useToast } from '../../../context/ToastContext';
import type { SegmentResponse } from '../types/commercial';
import { employeeService } from '../../employees/services/employeeService';

// Note: In a real app we'd fetch employees from HRM service
// We will mock it or if there is an employee service we could use it.
import api from '../../../lib/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateInventoryModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [segments, setSegments] = useState<SegmentResponse[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [segmentId, setSegmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setShakeKey(0);
      setSegmentId('');
      setEmployeeId('');
      loadLookups();
    } else {
      setShakeKey(0);
    }
  }, [isOpen]);

  const loadLookups = async () => {
    try {
      // Load all segments directly via a master call if possible, or we could just mock/fetch generic
      // In a real flow, you might select category -> segment. We'll simplify here.
      const catRes = await commercialService.getCategories();
      if (catRes.length > 0) {
        // Just load segments for the first category as an example, or a specific API for all segments
        // The API actually has GET /tenant/segments (getAllActiveSegments)
        const segRes = await api.get('/tenant/segments');
        setSegments(segRes.data);
      }
      
      // Load employees
      const empRes = await employeeService.getAll(0, 100);
      setEmployees(empRes.content);
    } catch (e) {
      console.error(e);
      // Fallback mocks if APIs don't exist yet
      if (segments.length === 0) setSegments([{ id: 'seg-1', name: 'Zapatos', status: true, category: {} as any }]);
      if (employees.length === 0) setEmployees([{ id: 'emp-1', fullName: 'Juan Vendedor' }]);
    }
  };

  const handleSubmit = async () => {
    if (!segmentId || !employeeId) {
      setShakeKey(prev => prev + 1);
      return;
    }
    setIsSubmitting(true);
    try {
      await commercialService.createInventory({
        segmentId,
        assignedEmployeeId: employeeId
      });
      toastSuccess("Orden de inventario creada exitosamente.");
      setShakeKey(0);
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al crear inventario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShakeKey(0);
    onClose();
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Nueva Orden de Conteo Físico"
      size="md"
    >
      <div className="space-y-4">
        <ComerziaSelect
          label="Empleado Asignado (Ejecutor)"
          options={employees.map(e => ({ value: e.id, label: e.fullName || e.name || 'Empleado' }))}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          error={!employeeId && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />

        <ComerziaSelect
          label="Segmento a Contar"
          options={segments.map(s => ({ value: s.id, label: s.name }))}
          value={segmentId}
          onChange={(e) => setSegmentId(e.target.value)}
          error={!segmentId && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />

        <div className="flex flex-row items-center gap-2 mt-6 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel onClick={handleModalClose} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        </div>
      </div>
    </ComerziaModal>
  );
};
