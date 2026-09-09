import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import { branchService } from '../../organization/services/branchService';
import { useCartStore } from '../store/useCartStore';
import type { SalesCatalogItem, SalesProductResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { CommercialProductSearchBar } from '../../commercial/components/CommercialProductSearchBar';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import type { CartItem } from '../store/useCartStore';
import { AlertCircle, ArrowRight, ShoppingCart, Store, ChevronDown, ChevronUp, Trash2, Tag, X } from 'lucide-react';

interface QuantityControlProps {
  item: CartItem;
  updateQuantity: (id: string, qty: number) => { success: boolean; message?: string };
  toastWarning: (msg: string) => void;
}

const QuantityControl = ({ item, updateQuantity, toastWarning }: QuantityControlProps) => {
  const factor = item.equivalenceFactor || 1;
  const maxPackages = Math.floor(item.stock / factor);
  const [val, setVal] = useState<string>(item.quantity.toString());

  useEffect(() => {
    setVal(item.quantity === 0 ? '' : item.quantity.toString());
  }, [item.quantity]);

  const handleCommit = () => {
    let qty = parseInt(val);
    if (isNaN(qty)) {
      setVal(item.quantity === 0 ? '' : item.quantity.toString());
      return;
    }

    const res = updateQuantity(item.productVariantId, qty);
    const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
    if (updatedItem) {
      setVal(updatedItem.quantity.toString());
    }
    if (!res.success && res.message) {
      toastWarning(res.message);
    }
  };

  const totalUnits = item.quantity * factor;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
        <button
          type="button"
          className="btn btn-circle btn-xs btn-ghost h-6 w-6 min-h-0 text-base-content/70 active:scale-95 transition-transform"
          onClick={() => {
            const res = updateQuantity(item.productVariantId, item.quantity - 1);
            const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
            if (updatedItem) setVal(updatedItem.quantity.toString());
            if (!res.success && res.message) toastWarning(res.message);
          }}
        >-</button>
        <input
          type="number"
          min={1}
          step={1}
          max={maxPackages > 0 ? maxPackages : 1}
          className="input input-bordered input-xs w-10 sm:w-12 font-mono text-xs font-bold text-center px-0.5 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={val}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-circle btn-xs btn-ghost h-6 w-6 min-h-0 text-base-content/70 active:scale-95 transition-transform"
          onClick={() => {
            const res = updateQuantity(item.productVariantId, item.quantity + 1);
            const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
            if (updatedItem) setVal(updatedItem.quantity.toString());
            if (!res.success && res.message) toastWarning(res.message);
          }}
        >+</button>
      </div>
      {factor > 1 && (
        <span className="text-[9px] text-base-content/50 font-mono font-medium leading-none mt-0.5">
          ({totalUnits} {totalUnits === 1 ? 'unid.' : 'unids.'})
        </span>
      )}
    </div>
  );
};

interface ProductDiscountControlProps {
  item: CartItem;
  currency: string;
  updateDiscount: (id: string, disc: number) => { success: boolean; message?: string };
  updateTotalDiscount: (id: string, totDisc: number) => { success: boolean; message?: string };
  toastWarning: (msg: string) => void;
  compact?: boolean;
}

const ProductDiscountControl = ({
  item,
  currency,
  updateDiscount,
  updateTotalDiscount,
  toastWarning,
  compact = false
}: ProductDiscountControlProps) => {
  const [mode, setMode] = useState<'UNIT' | 'TOTAL'>('UNIT');

  const factor = item.equivalenceFactor || 1;
  const totalUnits = item.quantity * factor;
  const maxUnitDiscount = Math.max(0, item.salePrice - item.discountPrice);
  const maxTotalDiscount = maxUnitDiscount * totalUnits;
  const currentTotalDiscount = item.discountAmount * totalUnits;

  const [val, setVal] = useState<string>(() => {
    if (mode === 'UNIT') {
      return item.discountAmount === 0 ? '' : Number(item.discountAmount.toFixed(2)).toString();
    } else {
      return currentTotalDiscount === 0 ? '' : Number(currentTotalDiscount.toFixed(2)).toString();
    }
  });

  useEffect(() => {
    if (mode === 'UNIT') {
      setVal(item.discountAmount === 0 ? '' : Number(item.discountAmount.toFixed(2)).toString());
    } else {
      setVal(currentTotalDiscount === 0 ? '' : Number(currentTotalDiscount.toFixed(2)).toString());
    }
  }, [item.discountAmount, item.quantity, mode]);

  const handleModeChange = (newMode: 'UNIT' | 'TOTAL') => {
    setMode(newMode);
    if (newMode === 'UNIT') {
      setVal(item.discountAmount === 0 ? '' : Number(item.discountAmount.toFixed(2)).toString());
    } else {
      setVal(currentTotalDiscount === 0 ? '' : Number(currentTotalDiscount.toFixed(2)).toString());
    }
  };

  const handleCommit = () => {
    const num = parseFloat(val) || 0;
    if (mode === 'UNIT') {
      const res = updateDiscount(item.productVariantId, num);
      const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
      if (updatedItem) {
        setVal(updatedItem.discountAmount === 0 ? '' : Number(updatedItem.discountAmount.toFixed(2)).toString());
      }
      if (!res.success && res.message) {
        toastWarning(res.message);
      }
    } else {
      const res = updateTotalDiscount(item.productVariantId, num);
      const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
      if (updatedItem) {
        const updatedTot = updatedItem.discountAmount * updatedItem.quantity * (updatedItem.equivalenceFactor || 1);
        setVal(updatedTot === 0 ? '' : Number(updatedTot.toFixed(2)).toString());
      }
      if (!res.success && res.message) {
        toastWarning(res.message);
      }
    }
  };

  const handleClear = () => {
    updateDiscount(item.productVariantId, 0);
    setVal('');
  };

  const currentMax = mode === 'UNIT' ? maxUnitDiscount : maxTotalDiscount;

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1 min-w-[125px]">
        {/* Toggle segmented button */}
        <div className="inline-flex p-0.5 rounded-md bg-base-200 border border-base-300">
          <button
            type="button"
            onClick={() => handleModeChange('UNIT')}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all ${
              mode === 'UNIT' ? 'bg-base-100 text-info shadow-xs' : 'text-base-content/50 hover:text-base-content'
            }`}
            title="Descuento por Unidad"
          >
            x Unid.
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('TOTAL')}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all ${
              mode === 'TOTAL' ? 'bg-base-100 text-info shadow-xs' : 'text-base-content/50 hover:text-base-content'
            }`}
            title="Descuento sobre Total"
          >
            Total
          </button>
        </div>

        {/* Input container with currency prefix & clean padding */}
        <div className="relative w-28">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-base-content/40 select-none pointer-events-none">
            {currency}
          </span>
          <input
            type="number"
            min="0"
            max={currentMax}
            step="0.01"
            placeholder="0.00"
            value={val}
            disabled={item.quantity === 0}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="input input-bordered input-xs w-full pl-8 pr-2.5 text-right font-mono font-bold text-info rounded focus:border-info focus:ring-1 focus:ring-info/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <span className="text-[9px] text-base-content/40 font-mono">
          Máx: {currentMax.toFixed(2)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Switcher Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-base-content/70">Modo de descuento:</span>
        <div className="inline-flex p-0.5 rounded-lg bg-base-300/60 border border-base-300">
          <button
            type="button"
            onClick={() => handleModeChange('UNIT')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              mode === 'UNIT'
                ? 'bg-base-100 text-info shadow-xs'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            Por Unidad
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('TOTAL')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              mode === 'TOTAL'
                ? 'bg-base-100 text-info shadow-xs'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            Por Total
          </button>
        </div>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-base-content/40 select-none pointer-events-none">
            {currency}
          </span>
          <input
            type="number"
            min="0"
            max={currentMax}
            step="0.01"
            placeholder="0.00"
            value={val}
            disabled={item.quantity === 0}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="input input-bordered input-sm w-full pl-12 pr-3 text-right font-mono font-bold text-info rounded-xl focus:border-info focus:ring-1 focus:ring-info/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        {item.discountAmount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-sm btn-ghost text-error hover:bg-error/10 px-2 rounded-xl"
            title="Quitar descuento"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between text-[11px] text-base-content/50 px-0.5">
        <span>{mode === 'UNIT' ? 'Descuento unitario' : 'Descuento total'}</span>
        <span className="font-mono font-medium">
          Máx. permitido: {currency} {currentMax.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export const NewSalePage = () => {
  const { hasPermission, userProfile } = useAuthStore();
  const hasSwitchBranchPerm = hasPermission('SWITCH_BRANCH');

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingInit, setIsLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const {
    items, addItem, removeItem, updateQuantity, updateDiscount, updateTotalDiscount, updatePriceType,
    setBranchId: setCartBranchId, clearCart, getSubtotal, getDiscountedAmount, getTotal
  } = useCartStore();

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

  useEffect(() => {
    initView();
    clearCart();
  }, []);

  const initView = async () => {
    setIsLoadingInit(true);
    setInitError(null);
    try {
      if (hasSwitchBranchPerm) {
        const branchPage = await branchService.getBranches(0, 100, true);
        const branchList = branchPage.content || [];
        setBranches(branchList);
        if (branchList.length > 0) {
          const firstBranchId = branchList[0].id;
          setSelectedBranchId(firstBranchId);
          setCartBranchId(firstBranchId);
        } else {
          setInitError('No se encontraron sucursales activas.');
        }
      } else {
        // Usuarios no-OWNER (ej: SELLER): El backend asigna la sucursal del turno activo.
        setSelectedBranchId('');
        setCartBranchId(null);
      }
    } catch (err: any) {
      if (hasSwitchBranchPerm) {
        setInitError('Error al inicializar las sucursales activas.');
      }
    } finally {
      setIsLoadingInit(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setCartBranchId(branchId);
    clearCart();
    toastWarning('Se cambió la sucursal. El pedido se ha limpiado.');
  };

  const handleProductSelect = (product: SalesProductResponse) => {
    const validPrices = product.activePrices?.filter(p => p.salePrice != null) || [];
    if (validPrices.length === 0) {
      toastError('Este producto no tiene precios activos configurados.');
      return;
    }
    const defaultPrice = validPrices.reduce((prev, curr) => curr.equivalenceFactor < prev.equivalenceFactor ? curr : prev);

    const catalogItem: SalesCatalogItem = {
      productVariantId: product.variantId,
      productName: product.name,
      variantName: product.nameVariant,
      sku: product.sku,
      barCode: '',
      stock: product.availableStock,
      priceTypeId: defaultPrice.priceTypeId,
      priceTypeName: defaultPrice.priceTypeName,
      salePrice: defaultPrice.salePrice,
      discountPrice: defaultPrice.discountPrice,
      equivalenceFactor: defaultPrice.equivalenceFactor || 1,
      activePrices: validPrices
    };

    const res = addItem(catalogItem, 1, 0);
    if (!res.success && res.message) {
      toastWarning(res.message);
    } else {
      toastSuccess(`Agregado: ${product.nameVariant}`);
    }
  };

  const handleScanBarcode = async (scannedCode: string) => {
    if (!scannedCode.trim()) return;
    try {
      const productResponse = await salesService.getProductDetailsByBarcode(scannedCode.trim());
      if (productResponse) {
        handleProductSelect(productResponse);
      } else {
        toastError(`No se encontró ningún producto con código "${scannedCode}"`);
      }
    } catch (err: any) {
      toastError(`No se encontró ningún producto con código "${scannedCode}"`);
    }
  };



  const handleSendToRegister = async () => {
    if (items.length === 0) {
      toastError('El carrito está vacío');
      return;
    }

    try {
      await salesService.createSale(
        {
          expectedTotalAmount: getTotal(),
          details: items.map(i => ({
            productVariantId: i.productVariantId,
            priceTypeId: i.priceTypeId,
            receiptQuantity: i.quantity,
            lineDiscountAmount: i.discountAmount
          }))
        },
        hasSwitchBranchPerm && selectedBranchId ? selectedBranchId : null
      );
      toastSuccess('¡Venta registrada con éxito y enviada a Caja!');
      clearCart();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al enviar la venta a Caja';
      toastError(msg);
    }
  };

  if (isLoadingInit) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="alert alert-error max-w-lg mx-auto mt-8">
        <AlertCircle size={24} />
        <span>{initError}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-4 sm:p-6 rounded-2xl border border-base-200 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content flex items-center gap-2">
            <ShoppingCart className="text-primary shrink-0" size={26} /> Nueva Venta (Registro)
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            Busca y selecciona productos para armar el pedido antes de enviar a caja.
          </p>
        </div>

        {/* Selector de Sucursal */}
        {hasSwitchBranchPerm && branches.length > 0 && (
          <div className="flex items-center gap-3 bg-base-200/50 p-2 sm:p-2.5 rounded-xl border border-base-300 w-full sm:w-auto max-w-full sm:max-w-xs shrink-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Store size={18} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/60 truncate">
                Sucursal de Origen
              </span>
              <select
                className="select select-bordered select-sm w-full bg-base-100 font-bold text-xs sm:text-sm text-base-content truncate pr-8 focus:border-primary focus:outline-none"
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} title={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Búsqueda de Productos y Tabla de Carrito (Ancho Completo) */}
      <div className="space-y-6">

        {/* Tarjeta de Búsqueda */}
        {/* Componente Buscador Optimizado (Nombre, SKU, Barcode, Cámara) */}
        <div className="bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-sm">
          <CommercialProductSearchBar 
            onSearchBarcode={handleScanBarcode}
            placeholder="Buscar producto por nombre, SKU o escanear..."
          />
        </div>

        {/* Tabla de Productos Seleccionados (Desktop) y Cards (Mobile) */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-base-200 flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wide text-base-content flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary shrink-0" /> Productos en Pedido ({items.length})
            </span>
            {items.length > 0 && (
              <ComerziaButton
                variant="delete"
                label="Vaciar Carrito"
                icon={<Trash2 size={14} />}
                className="btn-xs px-2 sm:px-3 min-w-0"
                responsive={true}
                tooltip="Vaciar Carrito"
                onClick={clearCart}
              />
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center text-base-content/40 space-y-3">
              <ShoppingCart size={44} className="stroke-1 text-base-content/20" />
              <p className="text-sm font-medium">El carrito está vacío</p>
              <p className="text-xs text-base-content/40 max-w-xs">
                Utiliza el buscador superior para agregar productos al pedido actual.
              </p>
            </div>
          ) : (
            <>
              {/* VISTA MOBILE: CARDS RESPONSIVAS */}
              <div className="block md:hidden divide-y divide-base-200">
                {items.map((item, idx) => {
                  const factor = item.equivalenceFactor || 1;
                  const totalUnits = item.quantity * factor;
                  const maxDiscount = item.salePrice - item.discountPrice;
                  const hasDiscountLimit = item.discountPrice < item.salePrice && maxDiscount > 0;
                  const totalDiscount = item.discountAmount * totalUnits;
                  const subtotal = item.salePrice * totalUnits;
                  const finalTotal = subtotal - totalDiscount;
                  const isExpanded = !!expandedItems[item.productVariantId];

                  return (
                    <div key={`mobile-${item.productVariantId}-${item.priceTypeId}`} className="p-3 space-y-2 bg-base-100">
                      {/* Cabecera de la Card: #, Nombre + Variante en una sola línea y botón X rojo */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                          <span className="badge badge-xs badge-ghost font-mono shrink-0">{idx + 1}</span>
                          <div className="min-w-0 flex-1 truncate whitespace-nowrap text-xs sm:text-sm">
                            <span className="font-bold text-base-content">
                              {item.productName}
                            </span>
                            <span className="text-primary font-semibold ml-1.5">
                              · {item.variantName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productVariantId)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 p-0.5 h-6 w-6 min-h-0 rounded-full shrink-0 flex items-center justify-center transition-colors"
                          title="Eliminar producto"
                        >
                          <X size={15} className="stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Fila Dividida en 3 Espacios: Presentación | Cantidad | Total */}
                      <div className="grid grid-cols-3 gap-2 items-center pt-0.5">
                        {/* 1. Presentación (Tipo de Precio) */}
                        <div className="w-full min-w-0">
                          <select
                            className="select select-bordered select-xs w-full font-bold text-xs text-base-content rounded-lg px-2 truncate"
                            value={item.priceTypeId}
                            onChange={(e) => {
                              const res = updatePriceType(item.productVariantId, e.target.value);
                              if (!res.success && res.message) toastWarning(res.message);
                            }}
                          >
                            {item.activePrices.map(p => {
                              const isDisabled = (p.equivalenceFactor || 1) > item.stock;
                              return (
                                <option
                                  key={p.priceTypeId}
                                  value={p.priceTypeId}
                                  disabled={isDisabled}
                                  title={p.priceTypeName}
                                >
                                  {p.priceTypeName} {isDisabled ? '(Sin stock)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* 2. Cantidad */}
                        <div className="flex justify-center w-full min-w-0">
                          <QuantityControl
                            item={item}
                            updateQuantity={updateQuantity}
                            toastWarning={toastWarning}
                          />
                        </div>

                        {/* 3. Total (Importe Final) */}
                        <div className="text-right w-full min-w-0">
                          <span className="text-xs sm:text-sm font-bold font-mono text-primary truncate block">
                            {currency} {finalTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Botón de Descuento (Solo si el tipo de precio lo permite) */}
                      {hasDiscountLimit && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setExpandedItems(prev => ({ ...prev, [item.productVariantId]: !prev[item.productVariantId] }))}
                            className={`btn btn-ghost btn-xs gap-1 pl-0 h-5 min-h-0 hover:bg-transparent ${
                              item.discountAmount > 0 ? 'text-info font-bold' : 'text-base-content/60 font-medium'
                            }`}
                          >
                            <Tag size={12} className={item.discountAmount > 0 ? 'text-info' : 'text-base-content/40'} />
                            <span className="text-[11px]">
                              {item.discountAmount > 0
                                ? `Desc: -${currency} ${totalDiscount.toFixed(2)}`
                                : (isExpanded ? 'Cerrar descuento' : '+ Agregar descuento')}
                            </span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      )}

                      {/* Acordeón Desplegable de Descuento (Solo si tiene límite y está expandido) */}
                      {hasDiscountLimit && isExpanded && (
                        <div className="bg-base-200/50 rounded-xl p-2.5 border border-base-200 text-xs mt-1">
                          <ProductDiscountControl
                            item={item}
                            currency={currency}
                            updateDiscount={updateDiscount}
                            updateTotalDiscount={updateTotalDiscount}
                            toastWarning={toastWarning}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* VISTA DESKTOP: TABLA COMPLETA */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200/50 border-b border-base-200 text-xs font-semibold uppercase">
                      <th className="w-8">#</th>
                      <th>Producto</th>
                      <th>Presentación</th>
                      <th className="text-center w-36">Cantidad</th>
                      <th className="text-right">Precio Unit.</th>
                      <th className="text-right">Subtotal</th>
                      <th className="text-right text-info font-bold">Descuento</th>
                      <th className="text-right bg-primary/5 font-bold text-primary">Importe Final</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const factor = item.equivalenceFactor || 1;
                      const totalUnits = item.quantity * factor;
                      const maxDiscount = item.salePrice - item.discountPrice;
                      const hasDiscountLimit = item.discountPrice < item.salePrice && maxDiscount > 0;
                      const totalDiscount = item.discountAmount * totalUnits;
                      const subtotal = item.salePrice * totalUnits;
                      const finalTotal = subtotal - totalDiscount;

                      return (
                        <tr key={`desktop-${item.productVariantId}-${item.priceTypeId}`} className="hover border-b border-base-200/50">
                          <td className="font-mono text-xs text-base-content/50">{idx + 1}</td>
                          <td>
                            <div className="flex flex-col gap-1 min-w-[150px]">
                              <span className="font-semibold text-sm leading-tight">{item.productName} | {item.variantName}</span>
                              <span className="text-[11px] text-base-content/50 font-mono">SKU: {item.sku}</span>
                            </div>
                          </td>
                          <td>
                            <select
                              className="select select-bordered select-xs w-full max-w-[120px]"
                              value={item.priceTypeId}
                              onChange={(e) => {
                                const res = updatePriceType(item.productVariantId, e.target.value);
                                if (!res.success && res.message) toastWarning(res.message);
                              }}
                            >
                              {item.activePrices.map(p => {
                                const isDisabled = (p.equivalenceFactor || 1) > item.stock;
                                return (
                                  <option
                                    key={p.priceTypeId}
                                    value={p.priceTypeId}
                                    disabled={isDisabled}
                                  >
                                    {p.priceTypeName} {isDisabled ? '(Sin stock)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td>
                            <QuantityControl
                              item={item}
                              updateQuantity={updateQuantity}
                              toastWarning={toastWarning}
                            />
                          </td>
                          <td className="font-mono text-sm text-right text-base-content/70">
                            {currency} {item.salePrice.toFixed(2)}
                          </td>
                          <td className="font-mono text-sm text-right text-base-content/70">
                            {currency} {subtotal.toFixed(2)}
                          </td>
                          <td className="text-right">
                            {hasDiscountLimit ? (
                              <ProductDiscountControl
                                item={item}
                                currency={currency}
                                updateDiscount={updateDiscount}
                                updateTotalDiscount={updateTotalDiscount}
                                toastWarning={toastWarning}
                                compact={true}
                              />
                            ) : (
                              <span className="text-xs text-base-content/30 font-mono">-</span>
                            )}
                          </td>
                          <td className="font-bold text-sm font-mono text-right bg-primary/5 text-primary">
                            {currency} {finalTotal.toFixed(2)}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productVariantId)}
                              className="btn btn-ghost btn-xs text-error hover:bg-error/10 p-1 h-6 w-6 min-h-0 rounded-full flex items-center justify-center ml-auto transition-colors"
                              title="Eliminar producto"
                            >
                              <X size={15} className="stroke-[2.5]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Resumen del Pedido en la Parte Inferior (Minimalista) */}
        <div className="bg-base-100 p-4 sm:p-6 rounded-2xl border border-base-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-base-content text-sm uppercase tracking-wide">
              Total del Pedido
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-mono font-black text-primary tracking-tight">
                {currency} {getTotal().toFixed(2)}
              </span>
              <span className="text-sm font-medium text-base-content/50 uppercase tracking-wide">Final</span>
            </div>
            {(getDiscountedAmount() > 0 || getSubtotal() > 0) && (
              <div className="flex items-center gap-3 text-xs sm:text-sm mt-2 font-medium">
                <span className="text-base-content/60">Subtotal: <span className="font-mono text-base-content">{currency} {getSubtotal().toFixed(2)}</span></span>
                {getDiscountedAmount() > 0 && (
                  <span className="text-error">Descuento: <span className="font-mono">-{currency} {getDiscountedAmount().toFixed(2)}</span></span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end w-full md:w-auto shrink-0">
            <ComerziaButton
              variant="primary"
              label="Enviar a Caja"
              icon={<ArrowRight size={24} />}
              className="shadow-xl shadow-primary/20 text-base sm:text-lg font-bold py-4 px-8 w-full md:w-auto h-auto rounded-2xl"
              disabled={items.length === 0}
              onClick={handleSendToRegister}
            />
          </div>
        </div>
      </div>


    </div>
  );
};
