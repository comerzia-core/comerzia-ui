import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaStepper } from '../../../components/ui/ComerziaStepper';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave, BtnBack, BtnNext } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type {
  BrandResponse,
  PriceTypeResponse,
  CreateFullVariantRequest,
  CategoryResponse,
  SegmentResponse
} from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { generateSku } from '../../../utils/skuGenerator';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useAuthStore } from '../../../stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCategoryId?: string;
  initialSegmentId?: string;
  initialBrandId?: string;
}

export const CreateFullProductModal = ({ isOpen, onClose, onSuccess, initialCategoryId, initialSegmentId, initialBrandId }: Props) => {
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

  const { options, isLoading: isLoadingDict } = useLoadDictionaries([DICTIONARIES.VARIANT_TYPE]);
  const variantTypeOptions = options[DICTIONARIES.VARIANT_TYPE] || [];

  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setDescription('');
      setCategoryId(initialCategoryId || '');
      setSegmentId(initialSegmentId || '');
      setBrandId(initialBrandId || '');
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
    }
  }, [categoryId]);

  useEffect(() => {
    if (segmentId) {
      commercialService.getBrandsBySegment(segmentId).then(setBrands);
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
              salePrice: '' as unknown as number,
              discountPrice: '' as unknown as number
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
    const processedVariants = variants.map(v => ({
      ...v,
      prices: v.prices.map(p => ({
        ...p,
        salePrice: Number(p.salePrice) || 0,
        discountPrice: Number(p.discountPrice) || 0
      })).filter(p => p.salePrice > 0)
    }));

    // Price validations
    for (const v of processedVariants) {
      for (const p of v.prices) {
        if (p.discountPrice > p.salePrice) {
          toastError(`El precio de descuento no puede ser mayor al de venta en: ${v.name}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await commercialService.createFullProduct({
        name,
        description: description || undefined,
        variantType: Number(variantType),
        brandId,
        variants: processedVariants
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

  const updatePrice = (variantIndex: number, priceIndex: number, field: string, value: number | string) => {
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
              uppercase
              onChange={(e) => {
                const newName = e.target.value.toUpperCase();
                const oldName = name;
                setName(newName);
                setVariants(prev => prev.map(v => {
                  const prevAutoSku = generateSku(oldName, v.name);
                  if (!v.sku || v.sku === prevAutoSku) {
                    return { ...v, sku: generateSku(newName, v.name) };
                  }
                  return v;
                }));
              }}
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

            <ComerziaSelect
              label="Categoría"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSegmentId('');
                setBrandId('');
              }}
            />
            <ComerziaSelect
              label="Segmento/Rubro"
              options={segments.map(s => ({ value: s.id, label: s.name }))}
              value={segmentId}
              onChange={(e) => {
                setSegmentId(e.target.value);
                setBrandId('');
              }}
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
                    uppercase
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const prevAutoSku = generateSku(name, variant.name);

                      const updated = [...variants];
                      updated[index].name = val;
                      if (!variant.sku || variant.sku === prevAutoSku) {
                        updated[index].sku = generateSku(name, val);
                      }
                      setVariants(updated);
                    }}
                    error={!variant.name && shakeKey > 0 ? "Requerido" : ""}
                    shakeKey={shakeKey}
                  />
                  <ComerziaInput
                    label="SKU Interno"
                    value={variant.sku}
                    uppercase
                    onChange={(e) => updateVariant(index, 'sku', e.target.value.toUpperCase())}
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
            {variants.map((variant, vIdx) => {
              const isFirstVariantComplete = variant.prices.length > 0 && variant.prices.every(p => p.salePrice > 0);

              return (
                <div key={vIdx} className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                  <h4 className="font-bold mb-4">Precios para: {variant.name || `Variante ${vIdx + 1}`}</h4>

                  {variant.prices.map((price, pIdx) => {
                    const priceTypeObj = priceTypes.find(pt => pt.id === price.priceTypeId);
                    const typeName = priceTypeObj?.name || 'Precio';
                    const equivalenceFactor = priceTypeObj?.equivalenceFactor || 1;

                    const saleTotal = (Number(price.salePrice) || 0) * equivalenceFactor;
                    const discountTotal = (Number(price.discountPrice) || 0) * equivalenceFactor;

                    return (
                      <div key={pIdx} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-start">
                        <div className="text-sm font-semibold opacity-70 mb-2 md:mb-0 mt-8">
                          {typeName}
                          <span className="block text-xs font-normal opacity-60 mt-1">
                            (Equivalencia: x{equivalenceFactor})
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <ComerziaInput
                            label="Precio Descuento Unit."
                            type="number"
                            value={price.discountPrice}
                            onChange={(e) => updatePrice(vIdx, pIdx, 'discountPrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                          />
                          {discountTotal > 0 && (
                            <div className="text-xs text-accent font-medium px-1 flex justify-between">
                              <span>Total Descuento:</span>
                              <span>{currencyCode} {discountTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <ComerziaInput
                            label="Precio Venta Unit."
                            type="number"
                            value={price.salePrice}
                            onChange={(e) => updatePrice(vIdx, pIdx, 'salePrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                          />
                          {saleTotal > 0 && (
                            <div className="text-xs text-primary font-bold px-1 flex justify-between">
                              <span>Total Venta:</span>
                              <span>{currencyCode} {saleTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {vIdx === 0 && variants.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          disabled={!isFirstVariantComplete}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newVariants = [...variants];
                              for (let i = 1; i < newVariants.length; i++) {
                                newVariants[i].prices = JSON.parse(JSON.stringify(variant.prices));
                              }
                              setVariants(newVariants);
                            }
                          }}
                        />
                        <span className={`label-text font-medium ${!isFirstVariantComplete ? 'opacity-50' : ''}`}>
                          Asignar estos precios a todas las variantes
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-between mt-8 pt-4 border-t border-base-200">
          {step === 1 ? (
            <BtnCancel onClick={onClose} disabled={isSubmitting} />
          ) : (
            <BtnBack onClick={() => setStep(prev => prev - 1)} disabled={isSubmitting} />
          )}
          {step < 3 ? (
            <BtnNext onClick={handleNext} disabled={isSubmitting} />
          ) : (
            <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
          )}
        </div>
      </div>
    </ComerziaModal>
  );
};
