import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { ProductResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';

import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: ProductResponse | null;
}

export const EditProductModal = ({ isOpen, onClose, onSuccess, product }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variantType, setVariantType] = useState('');
  const [status, setStatus] = useState(true);
  
  const { options, isLoading: isLoadingDict } = useLoadDictionaries([DICTIONARIES.VARIANT_TYPE]);
  const variantTypeOptions = options[DICTIONARIES.VARIANT_TYPE] || [];

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen && product) {
      setName(product.name);
      setDescription(product.description || '');
      setVariantType(product.variantType.toString());
      setStatus(product.status);
    }
  }, [isOpen, product]);

  const handleSubmit = async () => {
    if (!name || !variantType || !product?.brand?.id) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await commercialService.updateProduct(product.id, {
        name,
        description: description || undefined,
        variantType: Number(variantType),
        brandId: product.brand.id,
        status
      });
      toastSuccess("Producto actualizado exitosamente.");
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al actualizar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Producto: ${product.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <ComerziaInput
          label="Nombre del Producto"
          value={name}
          uppercase
          onChange={(e) => setName(e.target.value.toUpperCase())}
          error={!name && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />
        <ComerziaSelect
          label="Tipo de Variante"
          options={variantTypeOptions}
          isLoading={isLoadingDict}
          value={variantType}
          onChange={(e) => setVariantType(e.target.value)}
          error={!variantType && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />
        <ComerziaTextarea
          label="Descripción (Opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center gap-4 py-2">
          <span className="label-text">Estado del Producto (Activo/Inactivo)</span> 
          <ComerziaSwitch 
            checked={status} 
            onChange={() => setStatus(!status)} 
          />
        </div>

        <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-base-200">
          <BtnCancel onClick={onClose} disabled={isSubmitting} />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
        </div>
      </div>
    </ComerziaModal>
  );
};
