import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { PriceTypeResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  variantName: string;
  onSuccess: () => void;
}

export const ChangePriceModal = ({ isOpen, onClose, variantId, variantName, onSuccess }: Props) => {
  const [priceTypes, setPriceTypes] = useState<PriceTypeResponse[]>([]);
  const [priceTypeId, setPriceTypeId] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>(0);

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPriceTypes();
      setPriceTypeId('');
      setBasePrice('');
      setSalePrice('');
      setDiscountPrice(0);
    }
  }, [isOpen]);

  const loadPriceTypes = async () => {
    try {
      const pts = await commercialService.getPriceTypes();
      setPriceTypes(pts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    if (!priceTypeId || basePrice === '' || salePrice === '') {
      setShakeKey(prev => prev + 1);
      return;
    }
    setIsSubmitting(true);
    try {
      await commercialService.changePrice({
        variantId,
        priceTypeId,
        basePrice: Number(basePrice),
        salePrice: Number(salePrice),
        discountPrice: Number(discountPrice)
      });
      toastSuccess("Precio actualizado exitosamente. SCD Type 2 generado.");
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al actualizar el precio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Precio"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-info/10 text-info p-3 rounded-lg text-sm mb-4">
          Actualizando precio para: <strong>{variantName}</strong>. El sistema cerrará el precio anterior y activará este nuevo (SCD Type 2).
        </div>

        <ComerziaSelect
          label="Tipo de Precio"
          options={priceTypes.map(pt => ({ value: pt.id, label: pt.name }))}
          value={priceTypeId}
          onChange={(e) => setPriceTypeId(e.target.value)}
          error={!priceTypeId && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />

        <div className="grid grid-cols-2 gap-4">
          <ComerziaInput
            label="Costo Base"
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : '')}
            error={basePrice === '' && shakeKey > 0 ? "Requerido" : ""}
            shakeKey={shakeKey}
            isRequired
          />
          <ComerziaInput
            label="Precio de Venta"
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
            error={salePrice === '' && shakeKey > 0 ? "Requerido" : ""}
            shakeKey={shakeKey}
            isRequired
          />
        </div>

        <ComerziaInput
          label="Precio con Descuento (Opcional)"
          type="number"
          value={discountPrice}
          onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : '')}
        />

        <div className="flex justify-end gap-2 mt-8">
          <BtnCancel onClick={onClose} disabled={isSubmitting} />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
        </div>
      </div>
    </ComerziaModal>
  );
};
