import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { ProductVariantResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  variant: ProductVariantResponse | null;
}

export const EditVariantModal = ({ isOpen, onClose, onSuccess, productId, variant }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [barCode, setBarCode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState(true);
  
  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (variant) {
        setName(variant.name);
        setDescription(variant.description || '');
        setSku(variant.sku);
        setBarCode(variant.barCode);
        setImageUrl(variant.imageUrl || '');
        setStatus(variant.status);
      } else {
        setName('');
        setDescription('');
        setSku('');
        setBarCode('');
        setImageUrl('');
        setStatus(true);
      }
    }
  }, [isOpen, variant]);

  const handleSubmit = async () => {
    if (!name || !sku || !barCode) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        sku,
        barCode,
        imageUrl: imageUrl || undefined,
        productId,
        status
      };

      if (variant) {
        await commercialService.updateProductVariant(variant.id, payload);
        toastSuccess("Variante actualizada exitosamente.");
      } else {
        await commercialService.createProductVariant(payload);
        toastSuccess("Variante creada exitosamente.");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al procesar la variante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={variant ? `Editar Variante: ${variant.name}` : "Nueva Variante"}
      size="lg"
    >
      <div className="space-y-4">
        <ComerziaInput
          label="Nombre/Atributo (Ej: Azul - XL)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!name && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />
        <ComerziaInput
          label="SKU Interno"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          error={!sku && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />
        <ComerziaInput
          label="Código de Barras"
          value={barCode}
          onChange={(e) => setBarCode(e.target.value)}
          error={!barCode && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />
        <ComerziaInput
          label="URL de Imagen (Opcional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <ComerziaTextarea
          label="Descripción (Opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {variant && (
            <div className="flex items-center gap-4 py-2">
              <span className="label-text">Estado de la Variante (Activo/Inactivo)</span> 
              <ComerziaSwitch 
                checked={status} 
                onChange={() => setStatus(!status)} 
              />
            </div>
        )}

        <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-base-200">
          <BtnCancel onClick={onClose} disabled={isSubmitting} />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
        </div>
      </div>
    </ComerziaModal>
  );
};
