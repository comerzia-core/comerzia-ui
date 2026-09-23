import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import type { SalePriceResponse, PriceTypeResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { BadgePercent, X, Plus, Coins } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  variantName: string;
  onSuccess?: () => void;
}

interface PriceItemForm {
  priceTypeId: string;
  salePrice: number | string;
  discountPrice: number | string;
}

export const ManageVariantPricesModal = ({ isOpen, onClose, variantId, variantName, onSuccess }: Props) => {
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  const [priceTypes, setPriceTypes] = useState<PriceTypeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editPrices, setEditPrices] = useState<PriceItemForm[]>([]);
  const [openDiscounts, setOpenDiscounts] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen && variantId) {
      loadData();
    } else {
      setEditPrices([]);
      setOpenDiscounts({});
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
      initializeEditState(activePricesRes, typesRes);
    } catch (e: any) {
      console.error(e);
      toastError("Error al cargar los precios de la variante");
    } finally {
      setIsLoading(false);
    }
  };

  const initializeEditState = (currentPrices: SalePriceResponse[], types: PriceTypeResponse[]) => {
    const activeWithPrices = types
      .map(pt => {
        const found = currentPrices.find(ap =>
          ap.priceType?.id === pt.id || ap.priceTypeId === pt.id ||
          ap.priceType?.name === pt.name || ap.priceTypeName === pt.name
        );
        return {
          priceTypeId: pt.id,
          salePrice: (found && found.salePrice > 0) ? found.salePrice : '',
          discountPrice: (found && found.discountPrice && found.discountPrice > 0) ? found.discountPrice : ''
        };
      })
      .filter(p => Number(p.salePrice) > 0);

    // Si no hay precios configurados aún, inicializamos con el primer tipo de precio
    if (activeWithPrices.length === 0 && types.length > 0) {
      setEditPrices([{
        priceTypeId: types[0].id,
        salePrice: '',
        discountPrice: ''
      }]);
    } else {
      setEditPrices(activeWithPrices);
    }

    const discountsMap: Record<string, boolean> = {};
    activeWithPrices.forEach(p => {
      if (Number(p.discountPrice) > 0) {
        discountsMap[p.priceTypeId] = true;
      }
    });
    setOpenDiscounts(discountsMap);
  };

  const updateEditPrice = (priceTypeId: string, field: 'salePrice' | 'discountPrice', value: number | string) => {
    setEditPrices(prev => prev.map(p => {
      if (p.priceTypeId === priceTypeId) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const toggleDiscount = (priceTypeId: string) => {
    const isCurrentlyOpen = openDiscounts[priceTypeId] ?? false;
    if (isCurrentlyOpen) {
      updateEditPrice(priceTypeId, 'discountPrice', '');
      setOpenDiscounts(prev => ({ ...prev, [priceTypeId]: false }));
    } else {
      setOpenDiscounts(prev => ({ ...prev, [priceTypeId]: true }));
    }
  };

  const removePriceType = (priceTypeId: string) => {
    setEditPrices(prev => prev.filter(p => p.priceTypeId !== priceTypeId));
  };

  const addPriceType = (priceTypeId: string) => {
    setEditPrices(prev => [
      ...prev,
      {
        priceTypeId,
        salePrice: '',
        discountPrice: ''
      }
    ]);
  };

  const handleSubmit = async () => {
    // Validaciones por cada tipo de precio configurado
    for (const item of editPrices) {
      const sale = Number(item.salePrice);
      const pt = priceTypes.find(t => t.id === item.priceTypeId);
      const typeName = pt?.name || 'Tipo de precio';

      // 1. Validar que el precio de venta sea obligatorio y positivo
      if (!item.salePrice || isNaN(sale) || sale <= 0) {
        toastError(`El precio de venta es obligatorio y debe ser mayor a 0 para: ${typeName}`);
        return;
      }

      // 2. Validar precio de descuento si fue ingresado
      if (item.discountPrice !== '' && item.discountPrice != null) {
        const discount = Number(item.discountPrice);
        if (isNaN(discount) || discount < 0) {
          toastError(`El precio de descuento debe ser un valor positivo para: ${typeName}`);
          return;
        }
        if (discount >= sale) {
          toastError(`El precio de descuento (${discount.toFixed(2)}) debe ser menor al precio de venta (${sale.toFixed(2)}) para: ${typeName}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payloadPrices = editPrices.map((item) => {
        const sale = Number(item.salePrice);
        const rawDiscount = item.discountPrice !== '' && item.discountPrice != null ? Number(item.discountPrice) : null;
        const discount = rawDiscount != null && rawDiscount > 0 ? rawDiscount : null;
        return {
          priceTypeId: item.priceTypeId,
          salePrice: sale,
          discountPrice: discount
        };
      });

      await commercialService.syncVariantPrices(variantId, { prices: payloadPrices });
      toastSuccess("Precios sincronizados exitosamente");
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al sincronizar los precios de la variante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availablePriceTypes = priceTypes.filter(
    pt => !editPrices.some(p => p.priceTypeId === pt.id)
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modificar Precios: ${variantName}`}
      size="md"
      variant="form"
    >
      <div className="space-y-4">
        {/* Cabecera */}
        <div className="flex justify-between items-center pb-1">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-base-content text-sm sm:text-base">
              Configuración de Precios Vigentes
            </h3>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : (
          <div className="space-y-3">
            {editPrices.length > 0 ? (
              <div className="space-y-2.5">
                {editPrices.map((item) => {
                  const pt = priceTypes.find(t => t.id === item.priceTypeId);
                  const typeName = pt?.name || 'Precio';
                  const equivalenceFactor = pt?.equivalenceFactor || 1;
                  const isDiscountOpen = openDiscounts[item.priceTypeId] ?? (Number(item.discountPrice) > 0);
                  const saleTotal = (Number(item.salePrice) || 0) * equivalenceFactor;

                  return (
                    <div
                      key={item.priceTypeId}
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
                          onClick={() => removePriceType(item.priceTypeId)}
                          className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10 shrink-0 -mr-1 -mt-1"
                          title="Quitar este tipo de precio"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Inputs para Precio Venta y Descuento */}
                      {isDiscountOpen ? (
                        <div className="grid grid-cols-2 gap-2 w-full animate-fade-in">
                          {/* Precio Venta (50%) */}
                          <div className="min-w-0">
                            <ComerziaInput
                              type="number"
                              placeholder="Precio Venta"
                              value={item.salePrice}
                              onChange={(e) => updateEditPrice(item.priceTypeId, 'salePrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                              className="h-10 text-sm"
                            />
                          </div>

                          {/* Precio Descuento (50%) con X roja interna */}
                          <div className="relative min-w-0">
                            <ComerziaInput
                              type="number"
                              placeholder="Descuento"
                              value={item.discountPrice}
                              onChange={(e) => updateEditPrice(item.priceTypeId, 'discountPrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                              className="h-10 text-sm pr-8 border-secondary/50 focus:border-secondary"
                            />
                            <button
                              type="button"
                              onClick={() => toggleDiscount(item.priceTypeId)}
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
                              value={item.salePrice}
                              onChange={(e) => updateEditPrice(item.priceTypeId, 'salePrice', e.target.value.replace(/^0+(?=\d)/, ''))}
                              className="h-10 text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleDiscount(item.priceTypeId)}
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

            {/* Botones para habilitar tipos de precio restantes */}
            {availablePriceTypes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-base-content/60 font-medium">Habilitar tipo de precio:</span>
                {availablePriceTypes.map(pt => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => addPriceType(pt.id)}
                    className="btn btn-xs bg-base-100 hover:bg-primary hover:text-white text-primary border border-dashed border-primary/40 rounded-lg gap-1 font-medium transition-all shadow-2xs"
                  >
                    <Plus size={13} /> {pt.name} {pt.equivalenceFactor > 1 ? `(x${pt.equivalenceFactor})` : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Acciones Guardar / Cancelar (Al cancelar cierra el modal directamente) */}
            <div className="flex flex-row items-center gap-2 mt-6 pt-4 border-t border-base-200 w-full sm:justify-end">
              <BtnCancel
                onClick={onClose}
                disabled={isSubmitting}
                label="Cancelar"
                responsive={true}
                className="flex-1 sm:flex-none sm:w-auto min-w-0"
              />
              <BtnSave
                onClick={handleSubmit}
                isLoading={isSubmitting}
                label="Guardar"
                responsive={true}
                className="flex-1 sm:flex-none sm:w-auto min-w-0"
              />
            </div>
          </div>
        )}
      </div>
    </ComerziaModal>
  );
};
