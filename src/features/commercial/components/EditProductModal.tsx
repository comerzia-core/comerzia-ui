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
import { getCatalogErrorMessage } from '../utils/catalogErrorMessages';

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
      setShakeKey(0);
      setName(product.name);
      setDescription(product.description || '');
      setVariantType(product.variantType.toString());
      setStatus(product.status);
    } else {
      setShakeKey(0);
    }
  }, [isOpen, product]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setShakeKey(prev => prev + 1);
      toastError("Ingresa el nombre del producto.");
      return;
    }
    if (!variantType) {
      setShakeKey(prev => prev + 1);
      toastError("Selecciona el tipo de variante.");
      return;
    }
    if (!product?.brand?.id) {
      setShakeKey(prev => prev + 1);
      toastError("El producto debe tener una marca asociada.");
      return;
    }

    setIsSubmitting(true);
    try {
      await commercialService.updateProduct(product.id, {
        name: name.trim(),
        description: description?.trim() || undefined,
        variantType: Number(variantType),
        brandId: product.brand.id,
        status
      });
      toastSuccess("Producto actualizado exitosamente.");
      setShakeKey(0);
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(getCatalogErrorMessage(e, "Error al actualizar el producto."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShakeKey(0);
    onClose();
  };

  if (!product) return null;

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={handleModalClose}
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

        <div className="flex flex-row items-center gap-2 mt-6 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel onClick={handleModalClose} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        </div>
      </div>
    </ComerziaModal>
  );
};
