import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnPrint } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import { hardwareService } from '../../pos/services/hardwareService';
import { HwPrintJobTypeCode } from '../../pos/types/hardware';
import type { ProductResponse, ProductVariantResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { Barcode, Tag } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: ProductResponse | null;
}

export const PrintProductLabelsModal = ({ isOpen, onClose, product }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState({
    quantity: '1',
    width: '50',
    height: '30',
    gap: '2',
  });

  useEffect(() => {
    if (isOpen && product) {
      loadVariants(product.id);
      setForm({
        quantity: '1',
        width: '50',
        height: '30',
        gap: '2',
      });
    }
  }, [isOpen, product]);

  const loadVariants = async (productId: string) => {
    setIsLoadingVariants(true);
    try {
      const res = await commercialService.getVariantsByProduct(productId, 0, 50, true);
      const items = res.content || [];
      setVariants(items);
      if (items.length > 0) {
        setSelectedVariantId(items[0].id);
      }
    } catch {
      toastError('No se pudieron cargar las variantes del producto.');
    } finally {
      setIsLoadingVariants(false);
    }
  };

  if (!product) return null;

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || variants[0];

  const handlePrint = async () => {
    const qty = parseInt(form.quantity, 10);
    const w = parseInt(form.width, 10);
    const h = parseInt(form.height, 10);
    const g = parseInt(form.gap, 10);

    if (isNaN(qty) || qty <= 0) {
      setShakeKey(prev => prev + 1);
      toastError('Ingresa una cantidad válida mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const barcodeValue = selectedVariant?.barCode || selectedVariant?.sku || '00000000';
      const labelTitle = selectedVariant ? `${product.name} ${selectedVariant.name || ''}`.trim() : product.name;

      await hardwareService.createPrintJob({
        jobType: HwPrintJobTypeCode.LABEL_PRINT,
        payload: {
          width: isNaN(w) ? 50 : w,
          height: isNaN(h) ? 30 : h,
          gap: isNaN(g) ? 2 : g,
          items: [
            {
              productId: selectedVariant?.id || product.id,
              name: labelTitle,
              barcode: barcodeValue,
              barcodeType: 'CODE128',
              quantity: qty,
            },
          ],
        },
      });

      toastSuccess(`Trabajo de impresión de ${qty} etiqueta(s) enviado a la cola`);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al enviar trabajo de impresión de etiquetas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const variantOptions = variants.map(v => ({
    value: v.id,
    label: `${v.name || 'Estándar'} (${v.barCode || v.sku || 'Sin código'})`,
  }));

  const modalActions = (
    <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
      <BtnCancel onClick={onClose} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
      <BtnPrint
        onClick={handlePrint}
        isLoading={isSubmitting}
        responsive={true}
        label="Imprimir Etiquetas"
        className="flex-1 sm:flex-none sm:w-auto min-w-0"
      />
    </div>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary">
          <Barcode size={22} className="shrink-0" />
          <div>
            <h3 className="font-bold text-base sm:text-lg text-base-content leading-tight">Imprimir Etiquetas</h3>
            <p className="text-xs text-base-content/60 font-normal truncate max-w-xs">{product.name}</p>
          </div>
        </div>
      }
      actions={modalActions}
      size="sm"
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* Banner Producto */}
        <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl border border-base-200 text-xs">
          <Tag size={18} className="text-secondary shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold text-base-content block truncate">{product.name}</span>
            <span className="text-base-content/60">
              {product.brand?.name ? `Marca: ${product.brand.name}` : 'Sin marca'}
            </span>
          </div>
        </div>

        {/* Selector de Variante */}
        {variants.length > 1 && (
          <ComerziaSelect
            label="Variante a Imprimir"
            options={variantOptions}
            value={selectedVariantId}
            onChange={e => setSelectedVariantId(e.target.value)}
            placeholder={isLoadingVariants ? 'Cargando variantes...' : 'Selecciona una variante'}
          />
        )}

        {/* Vista previa del código */}
        {selectedVariant && (
          <div className="flex items-center justify-between p-2.5 bg-primary/5 rounded-xl border border-primary/20 text-xs">
            <div className="flex items-center gap-2">
              <Barcode size={16} className="text-primary" />
              <span className="font-mono font-semibold text-base-content">
                {selectedVariant.barCode || selectedVariant.sku || 'N/A'}
              </span>
            </div>
            <span className="text-[11px] text-base-content/60 font-semibold">CODE128</span>
          </div>
        )}

        {/* Cantidad de Etiquetas */}
        <ComerziaInput
          label="Cantidad de Etiquetas"
          type="number"
          min="1"
          value={form.quantity}
          onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
          isRequired
          error={!form.quantity || parseInt(form.quantity, 10) <= 0 ? 'Ingresa una cantidad válida' : undefined}
          shakeKey={shakeKey}
        />

        {/* Dimensiones térmicas */}
        <div className="grid grid-cols-3 gap-2">
          <ComerziaInput
            label="Ancho (mm)"
            type="number"
            value={form.width}
            onChange={e => setForm(prev => ({ ...prev, width: e.target.value }))}
          />
          <ComerziaInput
            label="Alto (mm)"
            type="number"
            value={form.height}
            onChange={e => setForm(prev => ({ ...prev, height: e.target.value }))}
          />
          <ComerziaInput
            label="Gap (mm)"
            type="number"
            value={form.gap}
            onChange={e => setForm(prev => ({ ...prev, gap: e.target.value }))}
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
