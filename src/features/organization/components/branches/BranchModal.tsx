// src/features/organization/components/branches/BranchModal.tsx
import React, { useState, useEffect } from 'react';
import { Store } from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { branchService } from '../../services/branchService';
import { useToast } from '../../../../context/ToastContext';
import type { BranchResponse, CreateBranchRequest, UpdateBranchRequest } from '../../types/branch';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  branchToEdit: BranchResponse | null;
  onSuccess: () => void; // Para recargar la tabla al guardar
}

export const BranchModal = ({ isOpen, onClose, branchToEdit, onSuccess }: Props) => {
  const { addToast: showToast } = useToast();

  
  const [isSaving, setIsSaving] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    status: 'true' // Guardamos como string para el Select, luego parseamos a boolean
  });

  const isEditing = !!branchToEdit;

  // Llenar el formulario si estamos editando o limpiar si es nuevo
  useEffect(() => {
    if (isOpen) {
      if (branchToEdit) {
        setFormData({
          name: branchToEdit.name,
          address: branchToEdit.address || '',
          status: branchToEdit.status ? 'true' : 'false'
        });
      } else {
        setFormData({ name: '', address: '', status: 'true' });
      }
      setErrors({});
    }
  }, [isOpen, branchToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeKey(prev => prev + 1); // Disparamos la vibración
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      if (isEditing) {
        const payload: UpdateBranchRequest = {
          name: formData.name,
          address: formData.address,
          status: formData.status === 'true'
        };
        await branchService.updateBranch(branchToEdit.id, payload);
        showToast('Branch updated successfully', 'success');
      } else {
        const payload: CreateBranchRequest = {
          name: formData.name,
          address: formData.address
        };
        await branchService.createBranch(payload);
        showToast('Branch created successfully', 'success');
      }
      
      onSuccess(); // Recargar tabla
      onClose(); // Cerrar modal
    } catch (error) {
      console.error('Error saving branch:', error);
      showToast('Error saving branch', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const modalActions = (
    <>
      <BtnCancel onClick={onClose} disabled={isSaving} />
      <BtnSave onClick={handleSave} isLoading={isSaving} />
    </>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary">
          <Store size={22} />
          {isEditing ? 'Edit Branch' : 'New Branch'}
        </div>
      }
      actions={modalActions}
      size="md"
    >
      <div className="space-y-4 pt-2">
        <ComerziaInput
          label="Branch Name"
          name="name"
          placeholder="e.g. Main Store, Downtown Branch"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          shakeKey={shakeKey}
          isRequired
          maxLength={100}
        />

        <ComerziaInput
          label="Address (Optional)"
          name="address"
          placeholder="123 Commerce St..."
          value={formData.address}
          onChange={handleChange}
          maxLength={200}
        />

        {/* Solo mostramos el estado si estamos editando (por defecto uno nuevo es Activo) */}
        {isEditing && (
          <ComerziaSelect
            label="Branch Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
          />
        )}
      </div>
    </ComerziaModal>
  );
};