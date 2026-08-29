import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import { branchService } from '../../organization/services/branchService';
import { useCartStore } from '../store/useCartStore';
import type { SalesCatalogItem, SalesProductResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaProductSearch } from '../components/ComerziaProductSearch';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BarcodeScannerModal } from '../../../components/ui/BarcodeScannerModal';
import { BtnCancel, BtnDeleteIcon } from '../../../components/ui/CrudButtons';
import type { CartItem } from '../store/useCartStore';
import { AlertCircle, ArrowRight, Barcode, Hash, Scan, ShoppingCart, Store, ScanBarcode, ChevronDown, ChevronUp, Eye, Trash2 } from 'lucide-react';

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
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          className="btn btn-circle btn-xs btn-ghost text-base-content/70 active:scale-95 transition-transform"
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
            const res = updateQuantity(item.productVariantId, item.quantity + 1);
            const updatedItem = useCartStore.getState().items.find(i => i.productVariantId === item.productVariantId);
            if (updatedItem) setVal(updatedItem.quantity.toString());
            if (!res.success && res.message) toastWarning(res.message);
          }}
        >+</button>
      </div>
      {factor > 1 && (
        <span className="text-[10px] text-base-content/50 font-mono mt-0.5 font-medium">
          ({totalUnits} {totalUnits === 1 ? 'unid.' : 'unids.'})
        </span>
      )}
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
      const updatedTotal = updatedItem.discountAmount * updatedItem.quantity * (updatedItem.equivalenceFactor || 1);
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
  const isOwner = roles.includes('OWNER');

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingInit, setIsLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [isManualSearching, setIsManualSearching] = useState(false);
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
      if (isOwner) {
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
      if (isOwner) {
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

  const handleManualSearch = async (type: 'sku' | 'barcode') => {
    if (!manualSearchTerm.trim()) return;

    setIsManualSearching(true);
    try {
      let productResponse: SalesProductResponse;
      if (type === 'sku') {
        productResponse = await salesService.getProductDetailsBySku(manualSearchTerm.trim());
      } else {
        productResponse = await salesService.getProductDetailsByBarcode(manualSearchTerm.trim());
      }

      if (productResponse) {
        handleProductSelect(productResponse);
        setManualSearchTerm('');
        if (type === 'sku') setIsSkuModalOpen(false);
        else setIsBarcodeModalOpen(false);
      } else {
        toastError(`No se encontró ningún producto con ese ${type.toUpperCase()}`);
      }
    } catch (err: any) {
      toastError(`No se encontró ningún producto con ese ${type.toUpperCase()}`);
    } finally {
      setIsManualSearching(false);
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
        isOwner && selectedBranchId ? selectedBranchId : null
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <ShoppingCart className="text-primary" size={28} /> Nueva Venta (Registro)
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Busca y selecciona productos para armar el pedido antes de enviar a caja.
          </p>
        </div>

        {/* Selector de Sucursal */}
        {isOwner && branches.length > 0 && (
          <div className="flex items-center gap-3 bg-base-200/50 p-2.5 rounded-xl border border-base-300">
            <Store size={20} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/60">Sucursal de Origen</span>
              <select
                className="select select-ghost select-sm font-bold text-base-content focus:bg-transparent -ml-2 -mt-1"
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
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
        <div className="bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3 gap-2">
            <h2 className="font-bold text-base-content flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wide truncate">
              <Scan size={18} className="text-primary shrink-0" />
              <span className="hidden sm:inline">Selección de Productos</span>
              <span className="sm:hidden">Productos</span>
            </h2>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <ComerziaButton
                variant="primary"
                label="Escanear Cámara / QR"
                icon={<ScanBarcode size={15} />}
                className="btn-xs sm:btn-sm px-2 sm:px-3 min-w-0"
                responsive={true}
                onClick={() => setIsScannerModalOpen(true)}
                tooltip="Escanear Cámara / QR"
              />
              <ComerziaButton
                variant="ghost"
                label="Buscar por SKU"
                icon={<Hash size={15} />}
                className="btn-xs sm:btn-sm px-2 sm:px-3 min-w-0 text-base-content/70 hover:bg-base-200"
                responsive={true}
                onClick={() => { setManualSearchTerm(''); setIsSkuModalOpen(true); }}
                tooltip="Buscar por SKU"
              />
              <ComerziaButton
                variant="ghost"
                label="Buscar por Código Barras"
                icon={<Barcode size={15} />}
                className="btn-xs sm:btn-sm px-2 sm:px-3 min-w-0 text-base-content/70 hover:bg-base-200"
                responsive={true}
                onClick={() => { setManualSearchTerm(''); setIsBarcodeModalOpen(true); }}
                tooltip="Buscar por Código de Barras"
              />
            </div>
          </div>

          {/* Componente Autocomplete */}
          <ComerziaProductSearch
            onProductSelect={handleProductSelect}
            onError={toastError}
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
                  const hasDiscountLimit = item.discountPrice < item.salePrice;
                  const totalDiscount = item.discountAmount * totalUnits;
                  const maxTotalDiscount = maxDiscount * totalUnits;
                  const subtotal = item.salePrice * totalUnits;
                  const finalTotal = subtotal - totalDiscount;
                  const isExpanded = !!expandedItems[item.productVariantId];

                  return (
                    <div key={`mobile-${item.productVariantId}-${item.priceTypeId}`} className="p-3.5 space-y-3 bg-base-100">
                      {/* Cabecera de la Card: #, Nombre, Variante, SKU y Eliminar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="badge badge-sm badge-ghost font-mono mt-0.5 shrink-0">{idx + 1}</span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-base-content leading-tight">
                              {item.productName}
                            </h4>
                            <p className="text-xs text-primary font-medium mt-0.5">
                              {item.variantName}
                            </p>
                            <span className="text-[10px] text-base-content/50 font-mono block mt-0.5">
                              SKU: {item.sku}
                            </span>
                          </div>
                        </div>
                        <BtnDeleteIcon
                          onClick={() => removeItem(item.productVariantId)}
                        />
                      </div>

                      {/* Select de Presentación y Control de Cantidad */}
                      <div className="grid grid-cols-2 gap-2.5 items-center pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-base-content/60 block mb-1">
                            Presentación
                          </label>
                          <select
                            className="select select-bordered select-sm w-full font-medium text-xs rounded-lg"
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
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-base-content/60 block mb-1 text-center">
                            Cantidad
                          </label>
                          <QuantityControl
                            item={item}
                            updateQuantity={updateQuantity}
                            toastWarning={toastWarning}
                          />
                        </div>
                      </div>

                      {/* Pie de Card: Botón Desglose y Total del Producto */}
                      <div className="flex items-center justify-between pt-1 border-t border-base-200/60">
                        <button
                          type="button"
                          onClick={() => setExpandedItems(prev => ({ ...prev, [item.productVariantId]: !prev[item.productVariantId] }))}
                          className="btn btn-ghost btn-xs gap-1 text-primary pl-0 hover:bg-transparent"
                        >
                          <Eye size={13} />
                          <span className="text-xs font-semibold">
                            {isExpanded ? 'Ocultar precios' : 'Detalles de precios'}
                          </span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        <div className="text-right">
                          <span className="text-[10px] text-base-content/50 uppercase block font-medium">
                            Importe Final
                          </span>
                          <span className="text-sm font-bold font-mono text-primary">
                            {currency} {finalTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Acordeón Desplegable de Precios y Descuentos */}
                      {isExpanded && (
                        <div className="bg-base-200/60 rounded-xl p-3 space-y-2.5 border border-base-200 text-xs mt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-base-content/60 block text-[11px]">Precio Unit.</span>
                              <span className="font-mono font-semibold text-base-content/80">
                                {currency} {item.salePrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-base-content/60 block text-[11px]">Subtotal</span>
                              <span className="font-mono font-semibold text-base-content/80">
                                {currency} {subtotal.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-base-200">
                            <div>
                              <label className="text-info font-medium block text-[11px] mb-1">
                                Desc. Unitario
                              </label>
                              <UnitDiscountControl
                                item={item}
                                maxDiscount={maxDiscount}
                                hasDiscountLimit={hasDiscountLimit}
                                updateDiscount={updateDiscount}
                                toastWarning={toastWarning}
                              />
                            </div>
                            <div className="text-right">
                              <label className="text-info font-medium block text-[11px] mb-1">
                                Desc. Total
                              </label>
                              <TotalDiscountControl
                                item={item}
                                maxTotalDiscount={maxTotalDiscount}
                                totalDiscount={totalDiscount}
                                hasDiscountLimit={hasDiscountLimit}
                                updateTotalDiscount={updateTotalDiscount}
                                toastWarning={toastWarning}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-base-200 text-xs">
                            <span className="text-base-content/70">P. Final Unit.:</span>
                            <span className="font-mono font-bold text-base-content/90">
                              {currency} {(item.salePrice - item.discountAmount).toFixed(2)}
                            </span>
                          </div>
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
                      <th>Tipo Unidad</th>
                      <th className="text-center w-36">Cantidad</th>
                      <th className="text-right">Precio Unit.</th>
                      <th className="text-right border-r border-base-300/50 text-info">Desc. Unit.</th>
                      <th className="text-right bg-primary/5">Subtotal</th>
                      <th className="text-right border-r border-base-300/50 text-info font-bold">Desc. Total</th>
                      <th className="text-right bg-primary/5">P. Final Unit.</th>
                      <th className="text-right bg-primary/5 font-bold text-primary">Importe Final</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const factor = item.equivalenceFactor || 1;
                      const totalUnits = item.quantity * factor;
                      const maxDiscount = item.salePrice - item.discountPrice;
                      const hasDiscountLimit = item.discountPrice < item.salePrice;
                      const totalDiscount = item.discountAmount * totalUnits;
                      const maxTotalDiscount = maxDiscount * totalUnits;
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
                            <BtnDeleteIcon
                              onClick={() => removeItem(item.productVariantId)}
                            />
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

        {/* Resumen del Pedido en la Parte Inferior */}
        <div className="bg-base-100 p-4 sm:p-6 rounded-2xl border border-base-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h2 className="font-bold text-base-content text-sm uppercase tracking-wide">
              Resumen del Pedido
            </h2>
            <p className="text-xs text-base-content/60 mt-0.5">
              {items.length} {items.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-6 md:gap-8">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-base-content/70 bg-base-200/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono font-bold text-base-content">{currency} {getSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-error bg-error/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                <span className="font-medium">Descuento:</span>
                <span className="font-mono font-bold">-{currency} {getDiscountedAmount().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3 bg-base-200/60 px-4 py-2.5 rounded-xl border border-base-200">
              <span className="font-bold text-sm sm:text-base text-base-content">Total:</span>
              <span className="font-bold text-xl sm:text-2xl font-mono text-primary">
                {currency} {getTotal().toFixed(2)}
              </span>
            </div>

            <ComerziaButton
              variant="primary"
              label="Enviar a Caja"
              icon={<ArrowRight size={20} />}
              className="shadow-lg shadow-primary/20 text-sm sm:text-base font-bold py-3 px-6 sm:px-8 w-full sm:w-auto"
              disabled={items.length === 0}
              onClick={handleSendToRegister}
            />
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setIsSkuModalOpen(false)} className="w-full sm:w-auto" />
            <ComerziaButton
              variant="primary"
              label="Buscar"
              onClick={() => handleManualSearch('sku')}
              disabled={!manualSearchTerm.trim() || isManualSearching}
              isLoading={isManualSearching}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </ComerziaModal>

      {/* MODAL CÓDIGO BARRAS */}
      <ComerziaModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        title="Buscar por Código de Barras"
      >
        <div className="space-y-4 pt-4">
          <ComerziaInput
            label="Código de Barras"
            value={manualSearchTerm}
            onChange={(e) => setManualSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch('barcode')}
            autoFocus
          />
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6">
            <ComerziaButton
              variant="secondary"
              label="Escanear con Cámara"
              icon={<ScanBarcode size={16} />}
              className="btn-sm w-full sm:w-auto"
              onClick={() => {
                setIsBarcodeModalOpen(false);
                setIsScannerModalOpen(true);
              }}
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <BtnCancel onClick={() => setIsBarcodeModalOpen(false)} className="w-full sm:w-auto" />
              <ComerziaButton
                variant="primary"
                label="Buscar"
                onClick={() => handleManualSearch('barcode')}
                disabled={!manualSearchTerm.trim() || isManualSearching}
                isLoading={isManualSearching}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </ComerziaModal>

      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScan={handleScanBarcode}
        title="Escanear Código de Barras / QR para Venta"
      />
    </div>
  );
};
