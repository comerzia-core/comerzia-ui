// src/features/commercial/components/BulkStockLimitsModal.tsx
import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import { useToast } from '../../../context/ToastContext';
import { Sliders } from 'lucide-react';

interface SelectedVariantItem {
  variantId: string;
  productName: string;
  variantName: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName?: string;
  selectedVariants: SelectedVariantItem[];
  onSuccess: () => void;
}

export const BulkStockLimitsModal = ({
  isOpen,
  onClose,
  branchId,
  branchName,
  selectedVariants,
  onSuccess
}: Props) => {
  const [minStock, setMinStock] = useState<number | ''>('');
  const [idealStock, setIdealStock] = useState<number | ''>('');
  const [errorMinStock, setErrorMinStock] = useState<string | undefined>();
  const [errorIdealStock, setErrorIdealStock] = useState<string | undefined>();
  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setMinStock('');
      setIdealStock('');
      setErrorMinStock(undefined);
      setErrorIdealStock(undefined);
      setShakeKey(0);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    let hasError = false;
    setErrorMinStock(undefined);
    setErrorIdealStock(undefined);

    if (minStock === '') {
      setErrorMinStock('El stock mínimo es obligatorio.');
      hasError = true;
    } else if (Number(minStock) < 0) {
      setErrorMinStock('No puede ser negativo.');
      hasError = true;
    }

    if (idealStock === '') {
      setErrorIdealStock('El stock ideal es obligatorio.');
      hasError = true;
    } else if (Number(idealStock) < 1) {
      setErrorIdealStock('Debe ser al menos 1 unidad.');
      hasError = true;
    }

    if (minStock !== '' && idealStock !== '' && Number(minStock) > Number(idealStock)) {
      setErrorMinStock('El stock mínimo no puede superar el stock ideal.');
      setErrorIdealStock('El stock ideal debe ser mayor o igual al mínimo.');
      hasError = true;
    }

    if (hasError || selectedVariants.length === 0 || !branchId) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await commercialService.updateBranchStockSettings({
        branchId,
        settings: selectedVariants.map(v => ({
          variantId: v.variantId,
          minStock: Number(minStock),
          idealStock: Number(idealStock)
        }))
      });
      toastSuccess(`Límites actualizados para ${selectedVariants.length} producto${selectedVariants.length > 1 ? 's' : ''}.`);
      onSuccess();
      onClose();
    } catch (e: any) {
      const data = e.response?.data;
      const errorCode = data?.errorCode || data?.code;
      if (errorCode === 'invalid_stock_settings') {
        toastError('El stock mínimo no puede superar el stock ideal.');
      } else {
        toastError(data?.message || 'Error al actualizar los límites de stock.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Límites de Stock"
      size="md"
    >
      <div className="space-y-4">
        {/* Banner de contexto de sucursal y selección */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Sliders size={16} />
            <span>Sucursal: {branchName || 'Seleccionada'}</span>
          </div>
          <span className="badge badge-primary badge-sm font-bold">
            {selectedVariants.length} seleccionados
          </span>
        </div>

        <p className="text-xs text-base-content/70 leading-relaxed">
          Define el umbral de alerta mínima y el objetivo de reabastecimiento para todos los productos seleccionados en esta sucursal.
        </p>

        {/* Inputs de configuración */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <ComerziaInput
              label="Stock Mínimo (Alerta)"
              type="number"
              placeholder="Ej. 10"
              value={minStock}
              onChange={e => {
                const val = e.target.value !== '' ? Number(e.target.value) : '';
                setMinStock(val);
                if (errorMinStock) setErrorMinStock(undefined);
              }}
              error={errorMinStock}
              shakeKey={shakeKey}
              isRequired
            />
            <span className="text-[11px] text-base-content/50 block mt-1">
              Dispara alerta de <strong>Stock Bajo</strong>.
            </span>
          </div>

          <div>
            <ComerziaInput
              label="Stock Ideal (Objetivo)"
              type="number"
              placeholder="Ej. 50"
              value={idealStock}
              onChange={e => {
                const val = e.target.value !== '' ? Number(e.target.value) : '';
                setIdealStock(val);
                if (errorIdealStock) setErrorIdealStock(undefined);
              }}
              error={errorIdealStock}
              shakeKey={shakeKey}
              isRequired
            />
            <span className="text-[11px] text-base-content/50 block mt-1">
              Meta para calcular <strong>Pedido Sugerido</strong>.
            </span>
          </div>
        </div>

        {/* Previsualización rápida de productos seleccionados */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-base-content/70 block mb-1.5">
            Productos a modificar:
          </label>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-base-200 rounded-xl p-2 bg-base-200/30">
            {selectedVariants.map((item, idx) => (
              <div
                key={`${item.variantId}-${idx}`}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-base-100 border border-base-200/60"
              >
                <span className="font-medium text-base-content truncate max-w-[200px] sm:max-w-[260px]">
                  {item.productName}
                </span>
                <span className="text-base-content/50 text-[11px] truncate max-w-[120px]">
                  {item.variantName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
          <BtnCancel onClick={onClose} disabled={isSubmitting} />
          <BtnSave
            onClick={handleSubmit}
            isLoading={isSubmitting}
            label="Aplicar a Todos"
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
