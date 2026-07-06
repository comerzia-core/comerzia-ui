import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave, BtnUpdatePrices } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { SalePriceResponse, PriceTypeResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  variantName: string;
}

export const VariantPricesModal = ({ isOpen, onClose, variantId, variantName }: Props) => {
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';
  const [activePrices, setActivePrices] = useState<SalePriceResponse[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceTypeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State for editing forms. We map priceTypeId -> { salePrice, discountPrice }
  const [editForms, setEditForms] = useState<Record<string, { salePrice: number; discountPrice: number }>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen && variantId) {
      loadData();
    } else {
      setIsEditing(false);
      setEditForms({});
    }
  }, [isOpen, variantId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [activePricesRes, typesRes] = await Promise.all([
        commercialService.getActiveSalePricesByVariant(variantId),
        commercialService.getPriceTypes()
      ]);

      setPriceTypes(typesRes);
      setActivePrices(activePricesRes);

      // Initialize edit forms with current active prices
      const initialForms: Record<string, { salePrice: number; discountPrice: number }> = {};
      typesRes.forEach(pt => {
        const currentPrice = activePricesRes.find(ap =>
          ap.priceType?.id === pt.id || ap.priceTypeId === pt.id ||
          ap.priceType?.name === pt.name || ap.priceTypeName === pt.name
        );
        initialForms[pt.id] = {
          salePrice: currentPrice?.salePrice || 0,
          discountPrice: currentPrice?.discountPrice || 0
        };
      });
      setEditForms(initialForms);

    } catch (e: any) {
      console.error(e);
      toastError("Error al cargar los precios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (priceTypeId: string, field: 'salePrice' | 'discountPrice', value: number) => {
    setEditForms(prev => ({
      ...prev,
      [priceTypeId]: {
        ...prev[priceTypeId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    // Validate discountPrice <= salePrice
    for (const pt of priceTypes) {
      const form = editForms[pt.id];
      if (form && form.salePrice > 0) {
        if (form.discountPrice > form.salePrice) {
          toastError(`El precio de descuento no puede ser mayor al de venta para el tipo: ${pt.name}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      // Find which prices actually changed or are new
      const promises = priceTypes.map(async (pt) => {
        const form = editForms[pt.id];
        const currentActive = activePrices.find(ap =>
          ap.priceType?.id === pt.id || ap.priceTypeId === pt.id ||
          ap.priceType?.name === pt.name || ap.priceTypeName === pt.name
        );

        // Only update if there's a valid sale price and it differs from current
        if (form && form.salePrice > 0) {
          if (!currentActive || currentActive.salePrice !== form.salePrice || currentActive.discountPrice !== form.discountPrice) {
            await commercialService.changePrice({
              priceTypeId: pt.id,
              variantId: variantId,
              salePrice: form.salePrice,
              discountPrice: form.discountPrice,
            });
          }
        }
      });

      await Promise.all(promises);
      toastSuccess("Precios actualizados exitosamente");
      setIsEditing(false);
      loadData();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al actualizar los precios");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Precios de: ${variantName}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-base-content/80">Listado de Precios</h3>
          {!isEditing && (
            <BtnUpdatePrices onClick={() => setIsEditing(true)} />
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : (
          <div className="flex flex-col border border-base-200 rounded-xl overflow-hidden">
            {priceTypes.map((pt, index) => {
              const currentActive = activePrices.find(ap =>
                ap.priceType?.id === pt.id || ap.priceTypeId === pt.id ||
                ap.priceType?.name === pt.name || ap.priceTypeName === pt.name
              );
              const form = editForms[pt.id];

              return (
                <div
                  key={pt.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 transition-colors hover:bg-base-200/30 ${index !== priceTypes.length - 1 ? 'border-b border-base-200' : ''
                    }`}
                >
                  <div className="font-medium text-base-content md:w-1/3 mt-2 md:mt-0">
                    {pt.name}
                    <span className="block text-xs font-normal opacity-60 mt-1">
                      (Equivalencia: x{pt.equivalenceFactor || 1})
                    </span>
                  </div>

                  <div className="flex-1 mt-4 md:mt-0">
                    {!isEditing ? (
                      <div className="flex justify-end items-center gap-8 text-sm">
                        {currentActive ? (
                          <>
                            <div className="flex flex-col items-end">
                              <span className="text-base-content/50 text-xs">Precio Venta Unit.</span>
                              <span className="font-semibold text-base">{currencyCode} {currentActive.salePrice}</span>
                              {currentActive.salePrice > 0 && (
                                <span className="text-xs text-primary font-bold mt-1">
                                  Total: {currencyCode} {(currentActive.salePrice * (pt.equivalenceFactor || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                            {currentActive.discountPrice > 0 && (
                              <div className="flex flex-col items-end text-success">
                                <span className="opacity-70 text-xs">Descuento Unit.</span>
                                <span className="font-semibold text-base">{currencyCode} {currentActive.discountPrice}</span>
                                <span className="text-xs text-accent font-medium mt-1">
                                  Total: {currencyCode} {(currentActive.discountPrice * (pt.equivalenceFactor || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-base-content/40 italic">Sin precio</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4 justify-end">
                        <div className="w-full md:w-36 flex flex-col gap-1">
                          <ComerziaInput
                            label="Descuento Unit."
                            type="number"
                            value={form?.discountPrice || 0}
                            onChange={(e) => handleUpdate(pt.id, 'discountPrice', Number(e.target.value.replace(/^0+(?=\d)/, '')))}
                          />
                          {(form?.discountPrice || 0) > 0 && (
                            <div className="text-xs text-accent font-medium px-1 flex justify-between">
                              <span>Total:</span>
                              <span>{currencyCode} {((form?.discountPrice || 0) * (pt.equivalenceFactor || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                        <div className="w-full md:w-36 flex flex-col gap-1">
                          <ComerziaInput
                            label="Venta Unit."
                            type="number"
                            value={form?.salePrice || 0}
                            onChange={(e) => handleUpdate(pt.id, 'salePrice', Number(e.target.value.replace(/^0+(?=\d)/, '')))}
                          />
                          {(form?.salePrice || 0) > 0 && (
                            <div className="text-xs text-primary font-bold px-1 flex justify-between">
                              <span>Total:</span>
                              <span>{currencyCode} {((form?.salePrice || 0) * (pt.equivalenceFactor || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-base-200">
            <BtnCancel onClick={() => setIsEditing(false)} disabled={isSubmitting} label="Cancelar" />
            <BtnSave onClick={handleSubmit} isLoading={isSubmitting} label="Guardar" />
          </div>
        )}
      </div>
    </ComerziaModal>
  );
};
