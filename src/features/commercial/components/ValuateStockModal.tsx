import { useState } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { commercialService } from '../services/commercialService';
import type { StockEntryResponse } from '../types/commercial';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stockEntry: StockEntryResponse | null;
}

export const ValuateStockModal = ({ isOpen, onClose, onSuccess, stockEntry }: Props) => {
  const [costInputType, setCostInputType] = useState<'unit' | 'total'>('unit');
  const [costInputValue, setCostInputValue] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  if (!stockEntry) return null;

  const qty = stockEntry.quantityIn;
  const val = typeof costInputValue === 'number' ? costInputValue : 0;
  
  const visualUnitCost = costInputType === 'unit' ? val : (qty > 0 ? Number((val / qty).toFixed(4)) : 0);
  const visualTotalCost = costInputType === 'total' ? val : Number((qty * val).toFixed(4));

  const handleSubmit = async () => {
    if (costInputValue === '') {
      toastError('Ingresa un costo válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await commercialService.valuateStockEntry(stockEntry.id, {
        unitCost: visualUnitCost,
        totalCost: visualTotalCost
      });
      toastSuccess('Stock valorizado correctamente.');
      setCostInputValue('');
      onSuccess();
      onClose();
    } catch (e: any) {
      const errorCode = e.response?.data?.errorCode;
      if (errorCode === 'invalid_cost_calculation') {
        toastError('Incongruencia de costos: El total no corresponde al unitario por la cantidad.');
      } else if (errorCode === 'bad_request') {
        toastError('Esta entrada ya fue valorizada o no está pendiente de costo.');
      } else if (errorCode === 'not_found' || e.response?.status === 404) {
        toastError('El registro de stock que intentas valorizar no existe.');
      } else {
        toastError(e.response?.data?.message || 'Error al valorizar el stock.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal isOpen={isOpen} onClose={onClose} title="Valorizar Stock Pendiente">
      <div className="space-y-4">
        <div className="bg-base-200 p-4 rounded-lg text-sm text-base-content/80 mb-4">
          <p>Cantidad Ingresada: <strong className="text-base-content">{qty}</strong></p>
          <p>Fecha de Ingreso: <strong>{new Date(stockEntry.entryDate).toLocaleString()}</strong></p>
        </div>
        
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-4">
            <span className="label-text">Ingresar por:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="costInputTypeModal" className="radio radio-primary radio-sm" checked={costInputType === 'unit'} onChange={() => { setCostInputType('unit'); setCostInputValue(''); }} />
              <span className="text-sm">Costo Unitario</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="costInputTypeModal" className="radio radio-primary radio-sm" checked={costInputType === 'total'} onChange={() => { setCostInputType('total'); setCostInputValue(''); }} />
              <span className="text-sm">Costo Total</span>
            </label>
          </label>
        </div>

        <ComerziaInput
          label={costInputType === 'unit' ? 'Costo Unitario' : 'Costo Total'}
          type="number"
          value={costInputValue}
          onChange={(e) => setCostInputValue(e.target.value ? Number(e.target.value) : '')}
          isRequired
        />

        {costInputValue !== '' && (
          <div className="text-sm text-base-content/70 bg-primary/10 p-3 rounded-lg flex justify-between items-center border border-primary/20">
            <span>{costInputType === 'unit' ? 'Costo Total Calculado:' : 'Costo Unitario Calculado:'}</span>
            <span className="font-bold text-primary text-lg">
              {costInputType === 'unit' ? visualTotalCost.toFixed(2) : visualUnitCost.toFixed(2)}
            </span>
          </div>
        )}

        <BtnSave 
          className="w-full mt-4" 
          label="Valorizar" 
          onClick={handleSubmit} 
          isLoading={isSubmitting} 
        />
      </div>
    </ComerziaModal>
  );
};
