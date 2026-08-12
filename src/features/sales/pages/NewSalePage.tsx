import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import { branchService } from '../../organization/services/branchService';
import { useCartStore } from '../store/useCartStore';
import type { SalesProductResponse, ActivePriceResponse, SalesCatalogItem } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaProductSearch } from '../components/ComerziaProductSearch';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import type { CartItem } from '../store/useCartStore';
import { AlertCircle, ArrowRight, Barcode, Hash, ShoppingCart, Store, Trash2 } from 'lucide-react';

interface QuantityControlProps {
  item: CartItem;
  updateQuantity: (id: string, qty: number) => { success: boolean; message?: string };
  toastWarning: (msg: string) => void;
}

const QuantityControl = ({ item, updateQuantity, toastWarning }: QuantityControlProps) => {
  const factor = item.equivalenceFactor || 1;
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

  return (
    <div className="flex items-center justify-center gap-1">
      <button 
        type="button"
        className="btn btn-circle btn-xs btn-ghost text-base-content/70 active:scale-95 transition-transform"
        onClick={() => {
          const res = updateQuantity(item.productVariantId, item.quantity - factor);
          const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
          if (updatedItem) setVal(updatedItem.quantity.toString());
          if (!res.success && res.message) toastWarning(res.message);
        }}
      >-</button>
      <input
        type="number"
        min={factor}
        step={factor}
        max={item.stock}
        className="input input-bordered input-sm w-16 font-mono text-center px-1 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
        className="btn btn-circle btn-xs btn-ghost text-base-content/70 active:scale-95 transition-transform"
        onClick={() => {
          const res = updateQuantity(item.productVariantId, item.quantity + factor);
          const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
          if (updatedItem) setVal(updatedItem.quantity.toString());
          if (!res.success && res.message) toastWarning(res.message);
        }}
      >+</button>
    </div>
  );
};

interface UnitDiscountControlProps {
  item: CartItem;
  maxDiscount: number;
  hasDiscountLimit: boolean;
  updateDiscount: (id: string, disc: number) => { success: boolean; message?: string };
  toastWarning: (msg: string) => void;
}

const UnitDiscountControl = ({ item, maxDiscount, hasDiscountLimit, updateDiscount, toastWarning }: UnitDiscountControlProps) => {
  const [val, setVal] = useState<string>(item.discountAmount === 0 ? '' : item.discountAmount.toString());

  useEffect(() => {
    setVal(item.discountAmount === 0 ? '' : item.discountAmount.toString());
  }, [item.discountAmount]);

  const handleCommit = () => {
    const disc = parseFloat(val) || 0;
    const res = updateDiscount(item.productVariantId, disc);
    const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
    if (updatedItem) {
      setVal(updatedItem.discountAmount === 0 ? '' : updatedItem.discountAmount.toString());
    }
    if (!res.success && res.message) {
      toastWarning(res.message);
    }
  };

  return (
    <input
      type="number"
      min="0"
      max={maxDiscount}
      step="0.01"
      className="input input-bordered input-sm w-full max-w-[80px] font-mono text-right text-info ml-auto block focus:ring-info/30"
      value={val}
      disabled={!hasDiscountLimit || item.quantity === 0}
      onWheel={(e) => (e.target as HTMLElement).blur()}
      placeholder="0.00"
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
};

interface TotalDiscountControlProps {
  item: CartItem;
  maxTotalDiscount: number;
  totalDiscount: number;
  hasDiscountLimit: boolean;
  updateTotalDiscount: (id: string, totDisc: number) => { success: boolean; message?: string };
  toastWarning: (msg: string) => void;
}

const TotalDiscountControl = ({ item, maxTotalDiscount, totalDiscount, hasDiscountLimit, updateTotalDiscount, toastWarning }: TotalDiscountControlProps) => {
  const [val, setVal] = useState<string>(totalDiscount === 0 ? '' : Number(totalDiscount.toFixed(2)).toString());

  useEffect(() => {
    setVal(totalDiscount === 0 ? '' : Number(totalDiscount.toFixed(2)).toString());
  }, [totalDiscount]);

  const handleCommit = () => {
    const totDisc = parseFloat(val) || 0;
    const res = updateTotalDiscount(item.productVariantId, totDisc);
    const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
    if (updatedItem) {
      const updatedTotal = updatedItem.discountAmount * updatedItem.quantity;
      setVal(updatedTotal === 0 ? '' : Number(updatedTotal.toFixed(2)).toString());
    }
    if (!res.success && res.message) {
      toastWarning(res.message);
    }
  };

  return (
    <input
      type="number"
      min="0"
      max={maxTotalDiscount}
      step="0.01"
      className="input input-bordered input-sm w-full max-w-[80px] font-mono text-right text-info font-bold ml-auto block focus:ring-info/30"
      value={val}
      disabled={!hasDiscountLimit || item.quantity === 0}
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      placeholder="0.00"
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
};

export const NewSalePage = () => {
  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];
  const isSeller = roles.includes('SELLER');
  const isOwner = roles.includes('OWNER');
  
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingInit, setIsLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Modales de Búsqueda Manual
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [isManualSearching, setIsManualSearching] = useState(false);

  // Modal Añadir a Carrito

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
      if (!isSeller) {
        setInitError("No tienes el rol de SELLER para realizar ventas.");
        setIsLoadingInit(false);
        return;
      }

      if (isOwner) {
        const branchRes = await branchService.getBranches(0, 100, true);
        setBranches(branchRes.content);
        if (branchRes.content.length === 0) {
          setInitError("No hay sucursales activas en la empresa.");
        }
      }
      // Si solo es SELLER, no llamamos al posService, el backend validará el turno al enviar el carrito.
    } catch (e: any) {
      setInitError("Error de inicialización de sucursales.");
    } finally {
      setIsLoadingInit(false);
    }
  };

  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    setCartBranchId(branchId);
  };

  const handleProductSelect = (product: SalesProductResponse) => {
    const validPrices = product.activePrices?.filter(p => p.salePrice != null) || [];
    if (validPrices.length === 0) {
      toastError("Este producto no tiene precios activos configurados.");
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
      salePrice: defaultPrice.salePrice,
      discountPrice: defaultPrice.discountPrice,
      priceTypeId: defaultPrice.priceTypeId,
      priceTypeName: defaultPrice.priceTypeName,
      equivalenceFactor: defaultPrice.equivalenceFactor,
      activePrices: validPrices
    };

    const initialQty = defaultPrice.equivalenceFactor || 1;
    const res = addItem(catalogItem, initialQty, 0);
    if (res.success) {
      toastSuccess(`${product.nameVariant} agregado al pedido.`);
    } else {
      toastError(res.message || "Error al agregar.");
    }
  };

  const handleManualSearch = async (type: 'sku' | 'barcode') => {
    if (!manualSearchTerm.trim()) return;
    setIsManualSearching(true);
    try {
      let product;
      if (type === 'sku') {
        product = await salesService.getProductDetailsBySku(manualSearchTerm.trim());
      } else {
        product = await salesService.getProductDetailsByBarcode(manualSearchTerm.trim());
      }
      setIsSkuModalOpen(false);
      setIsBarcodeModalOpen(false);
      setManualSearchTerm('');
      handleProductSelect(product);
    } catch (err: any) {
      toastError(`No se encontró ningún producto con ese ${type.toUpperCase()}.`);
    } finally {
      setIsManualSearching(false);
    }
  };

  const handleSendToRegister = async () => {
    if (items.length === 0) {
      toastWarning("El carrito está vacío.");
      return;
    }

    try {
      const payload = {
        expectedTotalAmount: getTotal(),
        details: items.map(i => ({
          productVariantId: i.productVariantId,
          priceTypeId: i.priceTypeId,
          receiptQuantity: i.quantity,
          lineDiscountAmount: i.discountAmount
        }))
      };

      await salesService.createSale(payload, isOwner ? selectedBranchId : null);
      toastSuccess("Pedido enviado a caja exitosamente. Estado: PENDIENTE.");
      clearCart();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Error al procesar la venta.");
    }
  };

  if (isLoadingInit) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center text-warning mb-2 shadow-lg">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-base-content text-center max-w-md">
          {isOwner ? "Atención" : "Turno Requerido"}
        </h2>
        <p className="text-base-content/60 text-center max-w-sm">
          {initError}
        </p>
      </div>
    );
  }

  // PRE-VISTA DE SELECCIÓN DE SUCURSAL (Solo OWNER)
  if (isOwner && !selectedBranchId) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-8 bg-base-100/50">
        <div className="text-center mb-10 space-y-2">
          <Store className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight">Selecciona una Tienda</h1>
          <p className="text-base-content/60 text-lg">¿Para qué sucursal armarás el pedido administrativo?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {branches.map(b => (
            <button
              key={b.id}
              onClick={() => handleSelectBranch(b.id)}
              className="flex flex-col items-center justify-center p-8 bg-base-100 rounded-3xl shadow-sm border border-base-200 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all group"
            >
              <div className="w-20 h-20 rounded-2xl bg-base-200 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                <Store className="w-10 h-10 text-base-content group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-base-content">{b.name}</h3>
              {b.code && <p className="text-xs font-mono text-base-content/40 mt-1">Ref: {b.code}</p>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Venta</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Arma el pedido y envíalo a caja para su cobro.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-base-50 p-2 px-4 rounded-xl border border-base-200">
          <Store className="text-primary" size={20} />
          <div className="flex flex-col">
            <span className="text-xs text-base-content/50 uppercase font-semibold">Sucursal Activa</span>
            <span className="text-sm font-bold text-primary">
              {branches.find(b => b.id === selectedBranchId)?.name || 'Asignada por Turno en Caja'}
            </span>
          </div>
          {isOwner && (
            <button 
              className="btn btn-ghost btn-xs text-primary"
              onClick={() => setSelectedBranchId('')}
            >
              Cambiar
            </button>
          )}
        </div>
      </div>

      <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative z-50">
          <label className="text-xs font-semibold text-base-content/60 mb-1 block">Buscar Producto por Nombre/SKU</label>
          <ComerziaProductSearch 
            onProductSelect={handleProductSelect} 
            onError={toastError} 
          />
        </div>
        
        <div className="flex items-center gap-2 mt-5 md:mt-0 pt-2 shrink-0">
          <button 
            className="btn btn-outline btn-sm gap-2"
            onClick={() => { setManualSearchTerm(''); setIsSkuModalOpen(true); }}
          >
            <Hash size={16} /> SKU
          </button>
          <button 
            className="btn btn-outline btn-sm gap-2"
            onClick={() => { setManualSearchTerm(''); setIsBarcodeModalOpen(true); }}
          >
            <Barcode size={16} /> Barcode
          </button>
        </div>
      </div>

      {/* CARRITO Y TOTALES */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-base-200 shrink-0 bg-base-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-secondary" />
            Listado del Pedido
          </h2>
        </div>

        <div className="overflow-y-auto p-4 min-h-[400px]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-base-content/40 border-2 border-dashed border-base-200 rounded-xl p-12">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-medium text-lg">El carrito está vacío</p>
              <p className="text-sm mt-1">Busca un producto para empezar.</p>
            </div>
          ) : (
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200/50">
                  <th rowSpan={2} className="align-bottom">#</th>
                  <th rowSpan={2} className="align-bottom">Producto</th>
                  <th rowSpan={2} className="align-bottom">Unidad</th>
                  <th rowSpan={2} className="align-bottom text-center">Cantidad</th>
                  <th colSpan={2} className="text-center border-x border-base-300/50">Por Unidad</th>
                  <th colSpan={2} className="text-center border-r border-base-300/50">Por Total</th>
                  <th colSpan={2} className="text-center bg-primary/5">Importe Final</th>
                  <th rowSpan={2}></th>
                </tr>
                <tr className="bg-base-200/50 text-[10px] uppercase tracking-wider">
                  <th className="text-right border-l border-base-300/50">Precio</th>
                  <th className="text-right border-r border-base-300/50 text-info">Desc.</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right border-r border-base-300/50 text-info">Desc.</th>
                  <th className="text-right bg-primary/5">Unitario</th>
                  <th className="text-right bg-primary/5">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const factor = item.equivalenceFactor || 1;
                  const maxDiscount = item.salePrice - item.discountPrice;
                  const hasDiscountLimit = item.discountPrice < item.salePrice;
                  const totalDiscount = item.discountAmount * item.quantity;
                  const maxTotalDiscount = maxDiscount * item.quantity;
                  const subtotal = item.salePrice * item.quantity;
                  const finalTotal = subtotal - totalDiscount;
                  return (
                    <tr key={`${item.productVariantId}-${item.priceTypeId}`} className="hover border-b border-base-200/50">
                      <td className="font-mono text-xs text-base-content/50">{idx + 1}</td>
                      <td>
                        <div className="flex flex-col gap-1 min-w-[150px]">
                          <span className="font-semibold text-sm leading-tight">{item.variantName}</span>
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
                      <td className="font-mono text-sm text-right border-l border-base-300/50 text-base-content/60">
                        {item.salePrice.toFixed(2)}
                      </td>
                      <td className="border-r border-base-300/50">
                        <UnitDiscountControl
                          item={item}
                          maxDiscount={maxDiscount}
                          hasDiscountLimit={hasDiscountLimit}
                          updateDiscount={updateDiscount}
                          toastWarning={toastWarning}
                        />
                      </td>
                      <td className="font-mono text-sm text-right text-base-content/60">
                        {subtotal.toFixed(2)}
                      </td>
                      <td className="border-r border-base-300/50">
                        <TotalDiscountControl
                          item={item}
                          maxTotalDiscount={maxTotalDiscount}
                          totalDiscount={totalDiscount}
                          hasDiscountLimit={hasDiscountLimit}
                          updateTotalDiscount={updateTotalDiscount}
                          toastWarning={toastWarning}
                        />
                      </td>
                      <td className="font-mono text-sm text-right bg-primary/5 text-base-content/80 font-medium">
                        {(item.salePrice - item.discountAmount).toFixed(2)}
                      </td>
                      <td className="font-bold text-sm font-mono text-right bg-primary/5 text-primary">
                        {currency} {finalTotal.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-md"
                          onClick={() => removeItem(item.productVariantId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* TOTALES FIJOS AL FONDO */}
        <div className="p-4 border-t border-base-200 bg-base-50/80 shrink-0">
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
            <div className="flex gap-6 font-mono text-sm">
              <div className="flex flex-col">
                <span className="text-base-content/60 text-xs">Subtotal</span>
                <span className="font-semibold">{currency} {getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-error text-xs">Desc. Manual</span>
                <span className="font-semibold">- {currency} {getDiscountedAmount().toFixed(2)}</span>
              </div>
              <div className="flex flex-col ml-4">
                <span className="text-base-content/80 text-xs uppercase font-bold tracking-wider">Total</span>
                <span className="text-2xl font-black text-primary leading-none">
                  {currency} {getTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-lg shadow-lg shadow-primary/30 min-w-[200px]"
              disabled={items.length === 0}
              onClick={handleSendToRegister}
            >
              Enviar a Caja
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL SKU */}
      <ComerziaModal
        isOpen={isSkuModalOpen}
        onClose={() => setIsSkuModalOpen(false)}
        title="Buscar por SKU"
      >
        <div className="space-y-4 pt-4">
          <ComerziaInput
            label="Código SKU"
            value={manualSearchTerm}
            onChange={(e) => setManualSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch('sku')}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setIsSkuModalOpen(false)} />
            <button 
              className="btn btn-primary" 
              onClick={() => handleManualSearch('sku')}
              disabled={!manualSearchTerm.trim() || isManualSearching}
            >
              {isManualSearching ? <span className="loading loading-spinner loading-sm" /> : "Buscar"}
            </button>
          </div>
        </div>
      </ComerziaModal>

      {/* MODAL BARCODE */}
      <ComerziaModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        title="Escáner Código de Barras"
      >
        <div className="space-y-4 pt-4">
          <div className="flex flex-col items-center justify-center p-6 bg-base-50 rounded-xl border-2 border-dashed border-base-200 mb-4">
            <Barcode size={48} className="text-base-content/30 mb-2" />
            <p className="text-sm text-base-content/60 text-center">Simulando escáner... Ingresa el código y presiona Enter.</p>
          </div>
          <ComerziaInput
            label="Código de Barras"
            value={manualSearchTerm}
            onChange={(e) => setManualSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch('barcode')}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setIsBarcodeModalOpen(false)} />
            <button 
              className="btn btn-primary" 
              onClick={() => handleManualSearch('barcode')}
              disabled={!manualSearchTerm.trim() || isManualSearching}
            >
              {isManualSearching ? <span className="loading loading-spinner loading-sm" /> : "Procesar"}
            </button>
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
