import { useState, useEffect, useMemo } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { SalePriceResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  variantName: string;
  activePrices?: SalePriceResponse[];
  initialPriceTypeId?: string;
  onSuccess: () => void;
}

export const ChangePriceModal = ({ isOpen, onClose, variantId, variantName, activePrices = [], initialPriceTypeId = '', onSuccess }: Props) => {
  const [priceTypeId, setPriceTypeId] = useState(initialPriceTypeId);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>(0);

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setPriceTypeId(initialPriceTypeId);
      setSalePrice('');
      setDiscountPrice(0);
    }
  }, [isOpen, initialPriceTypeId]);

  const handleSubmit = async () => {
    if (!priceTypeId || salePrice === '') {
      setShakeKey(prev => prev + 1);
      return;
    }
    setIsSubmitting(true);
    try {
      await commercialService.changePrice({
        variantId,
        priceTypeId,
        salePrice: Number(salePrice),
        discountPrice: Number(discountPrice) || Number(salePrice)
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

  const currentPrice = useMemo(() => {
    if (!priceTypeId || !activePrices.length) return null;
    return activePrices.find(p => p.priceTypeId === priceTypeId)?.salePrice || null;
  }, [priceTypeId, activePrices]);

  const variationData = useMemo(() => {
    if (currentPrice == null || salePrice === '' || Number(salePrice) === 0) return null;
    const newPrice = Number(salePrice);
    if (newPrice === currentPrice) return null;
    
    const diff = newPrice - currentPrice;
    const percentage = (diff / currentPrice) * 100;
    
    return {
      isUp: diff > 0,
      percentage: Math.abs(percentage).toFixed(2),
      diff: Math.abs(diff).toFixed(2)
    };
  }, [currentPrice, salePrice]);

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Precio"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-info/10 text-info p-3 rounded-lg text-sm mb-4">
          Actualizando precio para: <strong>{variantName}</strong>.<br/>
          Tipo de precio: <strong>{activePrices.find(p => p.priceTypeId === priceTypeId)?.priceTypeName || 'Desconocido'}</strong>.<br/>
          El sistema cerrará el precio anterior y activará este nuevo (SCD Type 2).
        </div>
        {currentPrice != null && (
          <div className="text-sm text-base-content/60 font-mono">
            Precio actual vigente: <strong>{currentPrice.toFixed(2)}</strong>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <ComerziaInput
              label="Precio de Venta"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
              error={salePrice === '' && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
            {variationData && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${variationData.isUp ? 'text-error' : 'text-success'}`}>
                {variationData.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                Estás {variationData.isUp ? 'subiendo' : 'bajando'} el precio un {variationData.percentage}%
              </div>
            )}
          </div>
          <ComerziaInput
            label="Precio con Descuento"
            type="number"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        <div className="flex justify-end gap-2 mt-8">
          <BtnCancel onClick={onClose} disabled={isSubmitting} />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
        </div>
      </div>
    </ComerziaModal>
  );
};
