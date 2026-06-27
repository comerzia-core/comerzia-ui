import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaStepper } from '../../../components/ui/ComerziaStepper';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { 
  BrandResponse, 
  PriceTypeResponse, 
  CreateFullVariantRequest, 
  CreateInitialPriceRequest,
  CategoryResponse,
  SegmentResponse
} from '../types/commercial';
import { useToast } from '../../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateFullProductModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [step, setStep] = useState(1);
  const steps = ["Información Base", "Variantes", "Precios Iniciales"];
  
  // Data State
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [segments, setSegments] = useState<SegmentResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceTypeResponse[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [segmentId, setSegmentId] = useState('');
  
  // Payload State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [variantType, setVariantType] = useState('1');
  const [variants, setVariants] = useState<CreateFullVariantRequest[]>([
    { name: '', sku: '', barCode: '', prices: [] }
  ]);

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setDescription('');
      setBrandId('');
      setCategoryId('');
      setSegmentId('');
      setVariantType('1');
      setVariants([{ name: '', sku: '', barCode: '', prices: [] }]);
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const cats = await commercialService.getCategories();
      setCategories(cats);
      const pts = await commercialService.getPriceTypes();
      setPriceTypes(pts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (categoryId) {
      commercialService.getSegmentsByCategory(categoryId).then(setSegments);
      setSegmentId('');
      setBrandId('');
    }
  }, [categoryId]);

  useEffect(() => {
    if (segmentId) {
      commercialService.getBrandsBySegment(segmentId).then(setBrands);
      setBrandId('');
    }
  }, [segmentId]);

  const handleNext = () => {
    if (step === 1) {
      if (!name || !brandId || !variantType) {
        setShakeKey(prev => prev + 1);
        return;
      }
    }
    if (step === 2) {
      for (const v of variants) {
        if (!v.name || !v.sku || !v.barCode) {
          setShakeKey(prev => prev + 1);
          toastError("Por favor completa todos los campos de las variantes.");
          return;
        }
      }
      
      // Initialize prices for step 3 if empty
      const updatedVariants = variants.map(v => {
        if (v.prices.length === 0) {
          return {
            ...v,
            prices: priceTypes.map(pt => ({
              priceTypeId: pt.id,
              basePrice: 0,
              salePrice: 0,
              discountPrice: 0
            }))
          };
        }
        return v;
      });
      setVariants(updatedVariants);
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await commercialService.createFullProduct({
        name,
        description: description || undefined,
        variantType: Number(variantType),
        brandId,
        variants
      });
      toastSuccess("Producto creado exitosamente.");
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al crear el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };

  const updatePrice = (variantIndex: number, priceIndex: number, field: string, value: number) => {
    const updated = [...variants];
    (updated[variantIndex].prices[priceIndex] as any)[field] = value;
    setVariants(updated);
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', sku: '', barCode: '', prices: [] }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Producto"
      size="xl"
    >
      <div className="space-y-6">
        <ComerziaStepper steps={steps} currentStep={step} />

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <ComerziaInput
              label="Nombre del Producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!name && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
            <ComerziaSelect
              label="Tipo de Variante"
              options={[
                { value: '1', label: 'Simple (Sin variaciones)' },
                { value: '2', label: 'Color' },
                { value: '3', label: 'Talla/Color' }
              ]}
              value={variantType}
              onChange={(e) => setVariantType(e.target.value)}
              error={!variantType && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
            
            <ComerziaSelect
              label="Categoría"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
            <ComerziaSelect
              label="Segmento/Rubro"
              options={segments.map(s => ({ value: s.id, label: s.name }))}
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              disabled={!categoryId}
            />
            <ComerziaSelect
              label="Marca"
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              error={!brandId && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              disabled={!segmentId}
              isRequired
            />
            
            <div className="md:col-span-2">
              <ComerziaTextarea
                label="Descripción (Opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            {variants.map((variant, index) => (
              <div key={index} className="bg-base-200/50 p-4 rounded-xl relative border border-base-200">
                {variants.length > 1 && (
                  <button 
                    className="btn btn-circle btn-sm btn-ghost absolute top-2 right-2 text-error"
                    onClick={() => removeVariant(index)}
                  >
                    ✕
                  </button>
                )}
                <h4 className="font-bold mb-4">Variante {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ComerziaInput
                    label="Nombre/Atributo (Ej: Azul - XL)"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    error={!variant.name && shakeKey > 0 ? "Requerido" : ""}
                    shakeKey={shakeKey}
                  />
                  <ComerziaInput
                    label="SKU Interno"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    error={!variant.sku && shakeKey > 0 ? "Requerido" : ""}
                    shakeKey={shakeKey}
                  />
                  <ComerziaInput
                    label="Código de Barras"
                    value={variant.barCode}
                    onChange={(e) => updateVariant(index, 'barCode', e.target.value)}
                    error={!variant.barCode && shakeKey > 0 ? "Requerido" : ""}
                    shakeKey={shakeKey}
                  />
                </div>
              </div>
            ))}
            <button className="btn btn-outline btn-primary w-full" onClick={addVariant}>
              + Añadir otra variante
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            {variants.map((variant, vIdx) => (
              <div key={vIdx} className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                <h4 className="font-bold mb-4">Precios para: {variant.name || `Variante ${vIdx + 1}`}</h4>
                
                {variant.prices.map((price, pIdx) => {
                  const typeName = priceTypes.find(pt => pt.id === price.priceTypeId)?.name || 'Precio';
                  return (
                    <div key={pIdx} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                      <div className="text-sm font-semibold opacity-70 mb-2 md:mb-0">
                        {typeName}
                      </div>
                      <ComerziaInput
                        label="Costo Base"
                        type="number"
                        value={price.basePrice}
                        onChange={(e) => updatePrice(vIdx, pIdx, 'basePrice', Number(e.target.value))}
                      />
                      <ComerziaInput
                        label="Precio de Venta"
                        type="number"
                        value={price.salePrice}
                        onChange={(e) => updatePrice(vIdx, pIdx, 'salePrice', Number(e.target.value))}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-8 pt-4 border-t border-base-200">
          <BtnCancel 
            label={step === 1 ? "Cancelar" : "Atrás"} 
            onClick={() => step === 1 ? onClose() : setStep(prev => prev - 1)} 
            disabled={isSubmitting}
          />
          {step < 3 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Siguiente
            </button>
          ) : (
            <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
          )}
        </div>
      </div>
    </ComerziaModal>
  );
};
