import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnSave, BtnCancel } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { FamilyResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
  onSuccess: () => void;
}

export const GroupFamilyModal = ({ isOpen, onClose, selectedProductIds, onSuccess }: Props) => {
  const [mode, setMode] = useState<'create' | 'add'>('create');
  
  // Create mode state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Add mode state
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(false);

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setMode('create');
      setName('');
      setDescription('');
      setSelectedFamilyId('');
      loadFamilies();
    }
  }, [isOpen]);

  const loadFamilies = async () => {
    setIsLoadingFamilies(true);
    try {
      const res = await commercialService.getFamilies();
      setFamilies(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFamilies(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'create') {
      if (!name) {
        setShakeKey(prev => prev + 1);
        return;
      }
      setIsSubmitting(true);
      try {
        await commercialService.createFamilyGroup({
          name,
          description: description || undefined,
          productIds: selectedProductIds
        });
        toastSuccess("Familia creada exitosamente.");
        onSuccess();
        onClose();
      } catch (e: any) {
        toastError(e.response?.data?.message || "Error al crear la familia.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedFamilyId) {
        setShakeKey(prev => prev + 1);
        return;
      }
      setIsSubmitting(true);
      try {
        await commercialService.addProductsToFamily(selectedFamilyId, {
          productIds: selectedProductIds
        });
        toastSuccess("Productos añadidos a la familia exitosamente.");
        onSuccess();
        onClose();
      } catch (e: any) {
        toastError(e.response?.data?.message || "Error al añadir a la familia.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Agrupar en Familia"
      size="md"
    >
      <div className="space-y-4">
        <div className="tabs tabs-boxed mb-6">
          <a 
            className={`tab ${mode === 'create' ? 'tab-active' : ''}`}
            onClick={() => setMode('create')}
          >
            Crear Nueva Familia
          </a>
          <a 
            className={`tab ${mode === 'add' ? 'tab-active' : ''}`}
            onClick={() => setMode('add')}
          >
            Añadir a Existente
          </a>
        </div>

        <div className="bg-info/10 text-info p-3 rounded-lg text-sm mb-4">
          Estás a punto de agrupar <strong>{selectedProductIds.length}</strong> productos seleccionados.
        </div>

        {mode === 'create' && (
          <div className="space-y-4 animate-fade-in">
            <ComerziaInput
              label="Nombre de la Familia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!name && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
            <ComerziaInput
              label="Descripción (Opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {mode === 'add' && (
          <div className="space-y-4 animate-fade-in">
            <ComerziaSelect
              label="Seleccionar Familia"
              options={families.map(f => ({ value: f.id, label: f.name }))}
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              isLoading={isLoadingFamilies}
              error={!selectedFamilyId && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-8">
          <BtnCancel onClick={onClose} disabled={isSubmitting} />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
        </div>
      </div>
    </ComerziaModal>
  );
};
