import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaStepper } from '../../../components/ui/ComerziaStepper';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
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
import { ComerziaSingleImageUploader, type SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import { BarcodeScannerModal } from '../../../components/ui/BarcodeScannerModal';
import { uploadFile } from '../../shared/services/storageService';
import { STORAGE_FOLDERS } from '../../../config/storage';
import { BtnScanIcon } from '../../../components/ui/CrudButtons';
import { BadgePercent, X, Plus } from 'lucide-react';
import { getCatalogErrorMessage } from '../utils/catalogErrorMessages';

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
  const [variantType, setVariantType] = useState('');
  const [variants, setVariants] = useState<CreateFullVariantRequest[]>([
    { name: '', sku: '', barCode: '', isInternalBarcode: false, prices: [] }
  ]);
  const [variantImages, setVariantImages] = useState<(SingleImageValue | null)[]>([null]);
  const [scanningVariantIndex, setScanningVariantIndex] = useState<number | null>(null);

  const { options, isLoading: isLoadingDict } = useLoadDictionaries([DICTIONARIES.VARIANT_TYPE]);
  const variantTypeOptions = options[DICTIONARIES.VARIANT_TYPE] || [];

  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();
  const [openDiscounts, setOpenDiscounts] = useState<Record<string, boolean>>({});

  const [nameError, setNameError] = useState('');
  const [barcodeErrors, setBarcodeErrors] = useState<Record<number, string>>({});

  const hasPreselectedHierarchy = Boolean(initialCategoryId && initialSegmentId && initialBrandId);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShakeKey(0);
      setNameError('');
      setBarcodeErrors({});
      setName('');
      setDescription('');
      setCategoryId(initialCategoryId || '');
      setSegmentId(initialSegmentId || '');
      setBrandId(initialBrandId || '');
      setVariantType('');
      setVariants([{ name: '', sku: '', barCode: '', isInternalBarcode: false, prices: [] }]);
      setVariantImages([null]);
      setOpenDiscounts({});
      loadInitialData();
      if (initialCategoryId) {
        commercialService.getSegmentsByCategory(initialCategoryId).then(setSegments);
      }
      if (initialSegmentId) {
        commercialService.getBrandsBySegment(initialSegmentId).then(setBrands);
      }
    } else {
      setShakeKey(0);
      setNameError('');
      setBarcodeErrors({});
    }
  }, [isOpen, initialCategoryId, initialSegmentId, initialBrandId]);

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

  const handleNext = async () => {
    if (step === 1) {
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
      if (!brandId) {
        setShakeKey(prev => prev + 1);
        toastError("Selecciona una marca.");
        return;
      }

      setIsSubmitting(true);
      try {
        const nameCheck = await commercialService.checkProductName(name.trim(), brandId);
        if (!nameCheck.available) {
          const rawMsg = nameCheck.message || '';
          const isAlreadyRegistered = rawMsg.toLowerCase().includes('registrado') || rawMsg.toLowerCase().includes('existe');
          setNameError(isAlreadyRegistered ? "Nombre ya registrado" : (rawMsg || "Nombre no disponible"));
          toastError(rawMsg || "Nombre ya registrado");
          setShakeKey(prev => prev + 1);
          return;
        }
      } catch (e: any) {
        toastError(getCatalogErrorMessage(e, "Error validando el nombre."));
        return;
      } finally {
        setIsSubmitting(false);
      }
    }
    if (step === 2) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.name.trim()) {
          setShakeKey(prev => prev + 1);
          toastError(`Completa el nombre de la variante ${i + 1}.`);
          return;
        }
        if (!v.isInternalBarcode && !v.barCode.trim()) {
          setShakeKey(prev => prev + 1);
          toastError(`Completa el código de barras de la variante ${i + 1}.`);
          return;
        }
      }

      // Validar códigos de barras duplicados entre variantes (solo para los que no son internos y tienen barcode)
      const scannedBarcodes = variants.filter(v => !v.isInternalBarcode && v.barCode.trim() !== '').map(v => v.barCode.trim());
      if (new Set(scannedBarcodes).size !== scannedBarcodes.length) {
        setShakeKey(prev => prev + 1);
        toastError("Hay códigos de barras duplicados entre las variantes.");
        return;
      }

      setIsSubmitting(true);
      try {
        const newBarcodeErrors: Record<number, string> = {};
        let hasBarcodeError = false;

        // Validar códigos de barras con el backend (solo si no son internos)
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (!v.isInternalBarcode && v.barCode.trim() !== '') {
            const checkBarcode = await commercialService.checkBarcode(v.barCode.trim());
            if (!checkBarcode.available) {
              const rawMsg = checkBarcode.message || '';
              const isAlreadyRegistered = rawMsg.toLowerCase().includes('registrado') || rawMsg.toLowerCase().includes('existe');
              newBarcodeErrors[i] = isAlreadyRegistered ? "Código ya registrado" : (rawMsg || "Código no disponible");
              toastError(`Variante ${i + 1}: ${rawMsg || "Código ya registrado"}`);
              hasBarcodeError = true;
            }
          }
        }

        if (hasBarcodeError) {
          setBarcodeErrors(newBarcodeErrors);
          setShakeKey(prev => prev + 1);
          return;
        }

        // Ensure sku is generated automatically in background and resolve conflicts (-1...N)
        const variantsWithSku = await Promise.all(variants.map(async (v) => {
          let availableSku = v.sku || generateSku(name, v.name);
          let isSkuAvailable = false;
          let counter = 1;
          const maxAttempts = 100;
          
          while (!isSkuAvailable && counter < maxAttempts) {
            const checkSku = await commercialService.checkSku(availableSku);
            if (checkSku.available) {
              isSkuAvailable = true;
            } else {
              availableSku = `${v.sku || generateSku(name, v.name)}-${counter}`;
              counter++;
            }
          }
          
          return {
            ...v,
            sku: availableSku
          };
        }));

        // Initialize prices for step 3 if empty (only first price type enabled by default)
        const updatedVariants = variantsWithSku.map(v => {
          if (v.prices.length === 0) {
            const initialPrices = priceTypes.length > 0 ? [{
              priceTypeId: priceTypes[0].id,
              salePrice: '' as unknown as number,
              discountPrice: '' as unknown as number
            }] : [];
            return {
              ...v,
              prices: initialPrices
            };
          }
          return v;
        });
        setVariants(updatedVariants);
      } catch (e: any) {
        toastError(getCatalogErrorMessage(e, "Error validando las variantes."));
        return;
      } finally {
        setIsSubmitting(false);
      }
    }
    setShakeKey(0);
    setNameError('');
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Subir imágenes de las variantes que tengan archivo nuevo
      const processedVariants = await Promise.all(variants.map(async (v, index) => {
        let finalImageUrl: string | undefined = undefined;
        const imgItem = variantImages[index];

        if (imgItem) {
          if (imgItem.file) {
            try {
              const cleanProductName = (name || 'prod').substring(0, 20);
              const cleanVariantName = (v.name || `var-${index + 1}`).substring(0, 20);
              finalImageUrl = await uploadFile(
                imgItem.file,
                STORAGE_FOLDERS.PRODUCTS,
                `${cleanProductName}-${cleanVariantName}-${Date.now()}`
              );
            } catch (uploadErr) {
              console.error("Error al subir imagen de variante:", uploadErr);
              throw new Error(`No se pudo subir la imagen de la variante: ${v.name || index + 1}`);
            }
          } else if (imgItem.preview) {
            finalImageUrl = imgItem.preview;
          }
        }

        return {
          ...v,
          imageUrl: finalImageUrl || undefined,
          prices: v.prices.map(p => ({
            ...p,
            salePrice: Number(p.salePrice) || 0,
            discountPrice: Number(p.discountPrice) || 0
          })).filter(p => p.salePrice > 0)
        };
      }));

      // Price validations
      for (const v of processedVariants) {
        for (const p of v.prices) {
          if (p.discountPrice > p.salePrice) {
            toastError(`El precio de descuento no puede ser mayor al de venta en: ${v.name}`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      await commercialService.createFullProduct({
        name,
        description: description || undefined,
        variantType: Number(variantType),
        brandId,
        variants: processedVariants
      });
      toastSuccess("Producto creado exitosamente.");
      setShakeKey(0);
      setNameError('');
      setBarcodeErrors({});
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(getCatalogErrorMessage(e, "Error al crear el producto."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setShakeKey(0);
    setNameError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleModalClose = () => {
    setShakeKey(0);
    setNameError('');
    setBarcodeErrors({});
    onClose();
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
    if (field === 'barCode' || field === 'name') {
      setBarcodeErrors(prev => ({ ...prev, [index]: '' }));
    }
  };

  const updatePrice = (variantIndex: number, priceIndex: number, field: string, value: number | string) => {
    const updated = [...variants];
    (updated[variantIndex].prices[priceIndex] as any)[field] = value;
    setVariants(updated);
  };

  const toggleDiscount = (key: string, variantIndex: number, priceIndex: number) => {
    const isCurrentlyOpen = openDiscounts[key] ?? (Number(variants[variantIndex]?.prices[priceIndex]?.discountPrice) > 0);
    if (isCurrentlyOpen) {
      updatePrice(variantIndex, priceIndex, 'discountPrice', '');
      setOpenDiscounts(prev => ({ ...prev, [key]: false }));
    } else {
      setOpenDiscounts(prev => ({ ...prev, [key]: true }));
    }
  };

  const removePriceType = (variantIndex: number, priceIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].prices = updated[variantIndex].prices.filter((_, i) => i !== priceIndex);
    setVariants(updated);
  };

  const addPriceType = (variantIndex: number, priceTypeId: string) => {
    const updated = [...variants];
    updated[variantIndex].prices = [
      ...updated[variantIndex].prices,
      {
        priceTypeId,
        salePrice: '' as unknown as number,
        discountPrice: '' as unknown as number
      }
    ];
    setVariants(updated);
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', sku: '', barCode: '', isInternalBarcode: false, prices: [] }]);
    setVariantImages([...variantImages, null]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
      setVariantImages(variantImages.filter((_, i) => i !== index));
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Crear Nuevo Producto"
      size="xl"
    >
      <div className="space-y-6">
        <ComerziaStepper steps={steps} currentStep={step} />

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {/* Resumen sutil cuando ya vienen preseleccionadas Categoría, Rubro y Marca */}
            {hasPreselectedHierarchy && (
              <div className="md:col-span-2 bg-base-200/60 px-3.5 py-2.5 rounded-xl border border-base-200 text-xs">
                <div className="flex flex-wrap items-center gap-1.5 text-base-content/70">
                  <span className="font-semibold text-base-content">Jerarquía preseleccionada:</span>
                  <span>{categories.find(c => c.id === categoryId)?.name || 'Categoría'}</span>
                  <span>›</span>
                  <span>{segments.find(s => s.id === segmentId)?.name || 'Rubro'}</span>
                  <span>›</span>
                  <span className="font-semibold text-primary">{brands.find(b => b.id === brandId)?.name || 'Marca'}</span>
                </div>
              </div>
            )}

            <ComerziaInput
              label="Nombre del Producto"
              value={name}
              uppercase
              onChange={(e) => {
                const newName = e.target.value.toUpperCase();
                const oldName = name;
                setName(newName);
                setNameError('');
                setVariants(prev => prev.map(v => {
                  const prevAutoSku = generateSku(oldName, v.name);
                  if (!v.sku || v.sku === prevAutoSku) {
                    return { ...v, sku: generateSku(newName, v.name) };
                  }
                  return v;
                }));
              }}
              error={(!name && shakeKey > 0) ? "Requerido" : (nameError || "")}
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

            {!hasPreselectedHierarchy && (
              <>
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

                <div className="md:col-span-2">
                  <ComerziaSelect
                    label="Marca"
                    options={brands.map(b => ({ value: b.id, label: b.name }))}
                    value={brandId}
                    onChange={(e) => {
                      setBrandId(e.target.value);
                      setNameError('');
                    }}
                    disabled={!segmentId}
                    error={!brandId && shakeKey > 0 ? "Requerido" : ""}
                    shakeKey={shakeKey}
                    isRequired
                  />
                </div>
              </>
            )}

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
                <h4 className="font-bold mb-4 text-base-content">Variante {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-4">
                      <ComerziaInput
                        label="Nombre/Atributo (Ej: Azul - XL)"
                        value={variant.name}
                        uppercase
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          const updated = [...variants];
                          updated[index].name = val;
                          updated[index].sku = generateSku(name, val);
                          setVariants(updated);
                          setBarcodeErrors(prev => ({ ...prev, [index]: '' }));
                        }}
                        error={!variant.name && shakeKey > 0 ? "Requerido" : ""}
                        shakeKey={shakeKey}
                        isRequired
                      />
                      <div className="flex items-center gap-4 pt-1">
                        <span className="label-text">Generar código de barras internamente</span> 
                        <ComerziaSwitch 
                          checked={variant.isInternalBarcode} 
                          onChange={() => {
                            const updated = [...variants];
                            updated[index].isInternalBarcode = !updated[index].isInternalBarcode;
                            if (updated[index].isInternalBarcode) {
                              updated[index].barCode = '';
                              setBarcodeErrors(prev => ({ ...prev, [index]: '' }));
                            }
                            setVariants(updated);
                          }} 
                        />
                      </div>
                      {!variant.isInternalBarcode && (
                        <div className="flex items-end gap-1.5 w-full min-w-0">
                          <div className="flex-1 min-w-0">
                            <ComerziaInput
                              label="Código de Barras"
                              value={variant.barCode}
                              onChange={(e) => updateVariant(index, 'barCode', e.target.value)}
                              error={(!variant.barCode && shakeKey > 0) ? "Requerido" : (barcodeErrors[index] || "")}
                              shakeKey={shakeKey}
                              isRequired
                              readOnly
                            />
                          </div>
                          <BtnScanIcon
                            onClick={() => setScanningVariantIndex(index)}
                            className="mb-0.5 h-[38px] w-[38px] min-h-0 shrink-0"
                            title="Escanear con cámara"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Imagen de la variante */}
                  <div className="md:col-span-1">
                    <ComerziaSingleImageUploader
                      label="Imagen Variante"
                      value={variantImages[index]}
                      onChange={(newImg) => {
                        const updated = [...variantImages];
                        updated[index] = newImg;
                        setVariantImages(updated);
                      }}
                      compact
                    />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-outline btn-primary w-full" onClick={addVariant}>
              + Añadir otra variante
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            {variants.map((variant, vIdx) => {
              const isFirstVariantComplete = variant.prices.length > 0 && variant.prices.every(p => Number(p.salePrice) > 0);
              const availablePriceTypes = priceTypes.filter(pt => !variant.prices.some(p => p.priceTypeId === pt.id));

              return (
                <div key={vIdx} className="bg-base-200/50 p-4 sm:p-5 rounded-2xl border border-base-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-2">
                      <span>Precios para:</span>
                      <span className="badge badge-primary badge-outline font-semibold">
                        {variant.name || `Variante ${vIdx + 1}`}
                      </span>
                    </h4>
                  </div>

                  {variant.prices.length > 0 ? (
                    <div className="space-y-2.5">
                      {variant.prices.map((price, pIdx) => {
                        const priceTypeObj = priceTypes.find(pt => pt.id === price.priceTypeId);
                        const typeName = priceTypeObj?.name || 'Precio';
                        const equivalenceFactor = priceTypeObj?.equivalenceFactor || 1;
                        const rowKey = `${vIdx}-${pIdx}`;
                        const isDiscountOpen = openDiscounts[rowKey] ?? (Number(price.discountPrice) > 0);

                        const saleTotal = (Number(price.salePrice) || 0) * equivalenceFactor;

                        return (
                          <div
                            key={pIdx}
                            className="bg-base-100 p-3.5 rounded-xl border border-base-200/80 shadow-2xs space-y-2.5 transition-all"
                          >
                            {/* Cabecera del Tipo de Precio: Nombre a la izq y X roja superior derecha */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-sm text-base-content flex items-center gap-2">
                                  <span>{typeName}</span>
                                  {equivalenceFactor > 1 && saleTotal > 0 && (
                                    <span className="text-[11px] text-primary font-medium">
                                      (Total: {currencyCode} {saleTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-base-content/60 font-medium">
                                  x{equivalenceFactor} {equivalenceFactor === 1 ? 'unidad' : 'unidades'}
                                </div>
                              </div>

                              {/* Botón X roja en la parte superior derecha */}
                              <button
                                type="button"
                                onClick={() => removePriceType(vIdx, pIdx)}
                                className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10 shrink-0 -mr-1 -mt-1"
                                title="Quitar este tipo de precio"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {/* Debajo: Inputs para Precio Venta y Descuento */}
                            {isDiscountOpen ? (
                              <div className="grid grid-cols-2 gap-2 w-full animate-fade-in">
                                {/* Precio Venta (50%) */}
                                <div className="min-w-0">
                                  <ComerziaInput
                                    type="number"
                                    placeholder="Precio Venta"
                                    value={price.salePrice}
                                    onChange={(e) => updatePrice(vIdx, pIdx, 'salePrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                                    className="h-10 text-sm"
                                  />
                                </div>

                                {/* Precio Descuento (50%) con X roja interna */}
                                <div className="relative min-w-0">
                                  <ComerziaInput
                                    type="number"
                                    placeholder="Descuento"
                                    value={price.discountPrice}
                                    onChange={(e) => updatePrice(vIdx, pIdx, 'discountPrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                                    className="h-10 text-sm pr-8 border-secondary/50 focus:border-secondary"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => toggleDiscount(rowKey, vIdx, pIdx)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-error hover:text-error/70 p-1 flex items-center justify-center transition-colors z-10"
                                    title="Quitar precio de descuento"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex-1 min-w-0">
                                  <ComerziaInput
                                    type="number"
                                    placeholder="Precio Venta"
                                    value={price.salePrice}
                                    onChange={(e) => updatePrice(vIdx, pIdx, 'salePrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                                    className="h-10 text-sm"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleDiscount(rowKey, vIdx, pIdx)}
                                  className="btn btn-ghost btn-sm h-10 px-3 text-base-content/60 hover:text-secondary hover:bg-secondary/10 border border-dashed border-base-300 rounded-lg gap-1.5 text-xs font-medium shrink-0 transition-colors"
                                  title="Agregar precio de descuento (opcional)"
                                >
                                  <BadgePercent size={16} className="text-secondary" />
                                  <span>Descuento</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 px-3 bg-base-100/60 rounded-xl border border-dashed border-base-300">
                      <p className="text-xs text-base-content/60 mb-2">No hay tipos de precio asignados para esta variante</p>
                    </div>
                  )}

                  {/* Botones para agregar tipos de precio restantes si los hay */}
                  {availablePriceTypes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-base-content/60 font-medium">Habilitar tipo de precio:</span>
                      {availablePriceTypes.map(pt => (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => addPriceType(vIdx, pt.id)}
                          className="btn btn-xs bg-base-100 hover:bg-primary hover:text-white text-primary border border-dashed border-primary/40 rounded-lg gap-1 font-medium transition-all shadow-2xs"
                        >
                          <Plus size={13} /> {pt.name} {pt.equivalenceFactor > 1 ? `(x${pt.equivalenceFactor})` : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {vIdx === 0 && variants.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-base-200">
                      <label className="label cursor-pointer justify-start gap-3 py-1">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm rounded-md"
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
                        <span className={`label-text text-sm font-medium ${!isFirstVariantComplete ? 'opacity-50' : ''}`}>
                          Asignar estos precios a todas las variantes
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-row items-center gap-2 mt-8 pt-4 border-t border-base-200 w-full sm:justify-end">
          {step === 1 ? (
            <BtnCancel onClick={handleModalClose} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          ) : (
            <BtnBack onClick={handleBack} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          )}
          {step < 3 ? (
            <BtnNext onClick={handleNext} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          ) : (
            <BtnSave onClick={handleSubmit} isLoading={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          )}
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={scanningVariantIndex !== null}
        onClose={() => setScanningVariantIndex(null)}
        onScan={(detectedCode) => {
          if (scanningVariantIndex !== null) {
            updateVariant(scanningVariantIndex, 'barCode', detectedCode);
          }
        }}
        title={`Escanear Código para Variante ${scanningVariantIndex !== null ? scanningVariantIndex + 1 : ''}`}
      />
    </ComerziaModal>
  );
};
