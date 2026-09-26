import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import { useCartStore } from '../store/useCartStore';
import type { SalesCatalogItem, SalesProductResponse, SalesCatalogSuggestionResponse, SaleResponse, SaleBranchResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { CommercialProductSearchBar } from '../../commercial/components/CommercialProductSearchBar';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import type { CartItem } from '../store/useCartStore';
import { AlertCircle, ArrowRight, ShoppingCart, Store, ChevronDown, ChevronUp, Trash2, Tag, X, Monitor } from 'lucide-react';

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
          className="input input-bordered input-xs w-12 sm:w-14 font-mono text-xs font-bold text-center px-2 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
  const maxUnitDiscount = (item.discountPrice != null && item.discountPrice < item.salePrice)
    ? Math.max(0, item.salePrice - item.discountPrice)
    : 0;
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
      <div className="flex items-center gap-1.5 justify-end min-w-[150px]">
        {/* Columna 1: Tabs Horizontales ("X Unid." y "Total") */}
        <div className="inline-flex flex-row p-0.5 rounded-md bg-base-200 border border-base-300 shrink-0">
          <button
            type="button"
            onClick={() => handleModeChange('UNIT')}
            className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all whitespace-nowrap ${mode === 'UNIT' ? 'bg-base-100 text-error shadow-xs' : 'text-base-content/50 hover:text-base-content'
              }`}
            title="Descuento por Unidad"
          >
            X Unid.
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('TOTAL')}
            className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all whitespace-nowrap ${mode === 'TOTAL' ? 'bg-base-100 text-error shadow-xs' : 'text-base-content/50 hover:text-base-content'
              }`}
            title="Descuento sobre Total"
          >
            Total
          </button>
        </div>

        {/* Columna 2: Input y Máximo debajo */}
        <div className="flex flex-col items-end gap-0.5">
          <div className="relative w-20">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-base-content/40 select-none pointer-events-none">
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
              className="input input-bordered input-xs w-full pl-6 pr-5 text-right font-mono font-bold text-error rounded focus:border-error focus:ring-1 focus:ring-error/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-[9px] text-base-content/40 font-mono whitespace-nowrap">
            Máx: {currentMax.toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {/* Columna 1: Tabs Verticales ("Por Unidad" y "Por Total") */}
      <div className="inline-flex flex-col p-0.5 rounded-lg bg-base-300/70 border border-base-300 shrink-0">
        <button
          type="button"
          onClick={() => handleModeChange('UNIT')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all whitespace-nowrap text-left ${mode === 'UNIT'
            ? 'bg-base-100 text-error shadow-xs'
            : 'text-base-content/60 hover:text-base-content'
            }`}
        >
          Por Unidad
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('TOTAL')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all whitespace-nowrap text-left ${mode === 'TOTAL'
            ? 'bg-base-100 text-error shadow-xs'
            : 'text-base-content/60 hover:text-base-content'
            }`}
        >
          Por Total
        </button>
      </div>

      {/* Columna 2: Fila superior (Input + X) y Fila inferior (Máx. permitido) */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {/* Input del Monto */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-base-content/40 select-none pointer-events-none">
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
              className="input input-bordered input-sm w-full pl-8 pr-4 text-right font-mono font-bold text-error rounded-xl focus:border-error focus:ring-1 focus:ring-error/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Botón X para limpiar */}
          {item.discountAmount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-sm btn-ghost text-error hover:bg-error/10 px-1.5 h-8 min-h-0 rounded-lg shrink-0 flex items-center justify-center transition-colors"
              title="Quitar descuento"
            >
              <X size={16} className="stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Texto de Límite Máximo Permitido */}
        <div className="flex justify-end text-[10px] text-base-content/50 px-0.5">
          <span className="font-mono font-medium">
            Máx. permitido: {currency} {currentMax.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const NewSalePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editSale = location.state?.editSale as SaleResponse | undefined;

  const { hasPermission, hasRole, userProfile } = useAuthStore();
  const hasSwitchBranchPerm = hasPermission('SWITCH_BRANCH');
  const roles = userProfile?.roles || [];
  const isCashier = hasRole('CASHIER') || roles.includes('CASHIER');
  const isSeller = hasRole('SELLER') || roles.includes('SELLER');
  const canAccessPosTerminal = (isCashier && isSeller);

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [branches, setBranches] = useState<SaleBranchResponse[]>([]);
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

    if (editSale) {
      setSelectedBranchId(editSale.branchId || '');
      setCartBranchId(editSale.branchId || null);
      if (hasSwitchBranchPerm) {
        try {
          const branchList = await salesService.getBranches();
          setBranches(branchList || []);
        } catch (_) { }
      }
      try {
        const details = await salesService.getSaleDetails(editSale.id);
        const newCartItems: CartItem[] = [];

        for (const d of details) {
          let productResponse = null;
          try {
            productResponse = await salesService.getProductDetailsById(d.productVariantId, editSale.branchId);
          } catch (err) {
            console.error("Error loading product detail", err);
          }

          if (productResponse && productResponse.activePrices && productResponse.activePrices.length > 0) {
            const activePrice = productResponse.activePrices.find((p: any) => p.priceTypeId === (d as any).priceTypeId) || productResponse.activePrices[0];
            const factor = activePrice.equivalenceFactor || 1;

            newCartItems.push({
              productVariantId: d.productVariantId,
              productName: d.productName,
              variantName: d.variantName || d.productName,
              sku: productResponse.sku,
              barCode: '',
              stock: productResponse.availableStock,
              priceTypeId: activePrice.priceTypeId,
              priceTypeName: activePrice.priceTypeName,
              salePrice: activePrice.salePrice,
              discountPrice: activePrice.discountPrice,
              equivalenceFactor: factor,
              activePrices: productResponse.activePrices,
              quantity: d.receiptQuantity || 1,
              discountAmount: (d.lineTotalDiscount || 0) / (d.receiptQuantity || 1) / factor
            });
          }
        }
        useCartStore.getState().setItems(newCartItems);
      } catch (err) {
        setInitError('Error al cargar los detalles de la venta a editar.');
      }
      setIsLoadingInit(false);
      return;
    }

    try {
      if (hasSwitchBranchPerm) {
        const branchList = await salesService.getBranches();
        setBranches(branchList || []);
        if (branchList && branchList.length > 0) {
          const currentBranch = branchList.find((b) => b.isCurrent);
          const defaultBranchId = currentBranch ? currentBranch.id : branchList[0].id;
          setSelectedBranchId(defaultBranchId);
          setCartBranchId(defaultBranchId);
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

  const handleSelectSuggestion = async (sug: SalesCatalogSuggestionResponse) => {
    const branchCtx = hasSwitchBranchPerm && selectedBranchId ? selectedBranchId : undefined;
    try {
      const productResponse = await salesService.getProductDetailsById(sug.variantId, branchCtx);
      if (productResponse) {
        handleProductSelect(productResponse);
      } else {
        toastError('No se pudo cargar la información del producto.');
      }
    } catch (err: any) {
      toastError('No se pudo cargar la información del producto seleccionado.');
    }
  };

  const handleScanBarcode = async (scannedCode: string) => {
    if (!scannedCode.trim()) return;
    const branchCtx = hasSwitchBranchPerm && selectedBranchId ? selectedBranchId : undefined;
    try {
      let productResponse: SalesProductResponse | null = null;
      try {
        productResponse = await salesService.getProductDetailsByBarcode(scannedCode.trim(), branchCtx);
      } catch {
        try {
          productResponse = await salesService.getProductDetailsBySku(scannedCode.trim(), branchCtx);
        } catch {
          try {
            productResponse = await salesService.getProductDetailsById(scannedCode.trim(), branchCtx);
          } catch {
            productResponse = null;
          }
        }
      }

      if (productResponse) {
        handleProductSelect(productResponse);
      } else {
        toastError(`No se encontró ningún producto con código "${scannedCode}"`);
      }
    } catch (err: any) {
      toastError(`No se encontró ningún producto con código "${scannedCode}"`);
    }
  };



  const mapSaleError = (err: any, isEditMode: boolean): string => {
    const status = err?.response?.status;
    const rawMsg = err?.response?.data?.message || err?.message || '';
    const lowerMsg = typeof rawMsg === 'string' ? rawMsg.toLowerCase() : '';

    // Mapeo por mensaje específico del backend (en inglés o español)
    if (lowerMsg.includes('discount limit') || lowerMsg.includes('descuento')) {
      return 'El descuento ingresado supera el límite máximo permitido.';
    }
    if (lowerMsg.includes('insufficient stock') || lowerMsg.includes('stock insuficiente')) {
      return 'Stock insuficiente para uno o varios productos seleccionados.';
    }
    if (lowerMsg.includes('checksum mismatch') || lowerMsg.includes('checksum')) {
      return 'Discrepancia en el cálculo del total de la venta.';
    }
    if (lowerMsg.includes('no open cash register') || lowerMsg.includes('turnos de caja') || (lowerMsg.includes('shift') && lowerMsg.includes('open'))) {
      return 'No hay turnos de caja abiertos en esta sucursal.';
    }
    if (lowerMsg.includes('not in pending') || lowerMsg.includes('not pending')) {
      return 'La venta ya no se encuentra en estado Pendiente.';
    }
    if (lowerMsg.includes('variant') && lowerMsg.includes('not found')) {
      return 'Una de las variantes de producto seleccionadas ya no existe.';
    }
    if (lowerMsg.includes('pricetype') && lowerMsg.includes('not found')) {
      return 'El tipo de precio seleccionado no fue encontrado.';
    }
    if (lowerMsg.includes('sale not found') || (lowerMsg.includes('sale') && lowerMsg.includes('not found'))) {
      return 'La venta especificada no fue encontrada.';
    }

    // Mapeo por Código HTTP según especificación de TenantSaleApiDoc
    if (status === 400) {
      return 'Datos inválidos: verifique que las cantidades no excedan el stock disponible y que los descuentos no superen el límite.';
    }
    if (status === 403) {
      return 'No tienes permisos para realizar esta operación.';
    }
    if (status === 404) {
      return isEditMode
        ? 'No se encontró la venta, el producto o el tipo de precio a actualizar.'
        : 'Producto, variante o tipo de precio no encontrado.';
    }
    if (status === 409) {
      return isEditMode
        ? 'La venta no se puede actualizar porque ya no se encuentra en estado Pendiente.'
        : 'No hay turnos de caja abiertos en esta sucursal para recibir la venta.';
    }
    if (status === 500) {
      return 'Ocurrió un error en el servidor al procesar la venta. Por favor, inténtelo de nuevo.';
    }

    return rawMsg || (isEditMode ? 'Error al actualizar la venta pendiente.' : 'Error al enviar la venta a Caja.');
  };

  const handleSendToRegister = async () => {
    if (items.length === 0) {
      toastError('El carrito está vacío. Agregue al menos un producto.');
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

      if (editSale) {
        await salesService.updatePendingSale(editSale.id, payload as any);
        toastSuccess('Venta pendiente actualizada con éxito.');
        clearCart();
        navigate('/sales/history');
      } else {
        await salesService.createSale(payload, hasSwitchBranchPerm && selectedBranchId ? selectedBranchId : null);
        toastSuccess('¡Venta registrada con éxito y enviada a Caja!');
        clearCart();
      }
    } catch (err: any) {
      const msg = mapSaleError(err, !!editSale);
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
            <ShoppingCart className="text-primary shrink-0" size={26} /> {editSale ? `Editar Venta ${editSale.saleNumber || ''}` : 'Nueva Venta (Registro)'}
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            {editSale ? 'Modifica los productos y cantidades de la venta.' : 'Busca y selecciona productos para armar el pedido antes de enviar a caja.'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Botón Ir a Terminal de Cobro (POS) */}
          {canAccessPosTerminal && (
            <ComerziaButton
              variant="ghost"
              label="Terminal de Cobro"
              responsive={true}
              tooltip="Terminal de Cobro"
              icon={<Monitor size={18} className="text-primary" />}
              className="font-semibold rounded-xl border border-base-300 hover:border-primary hover:bg-primary/10 transition-all text-xs sm:text-sm px-3 sm:px-4 min-w-0 shrink-0 h-11 sm:h-[52px]"
              onClick={() => navigate('/pos/terminal')}
            />
          )}

          {/* Selector de Sucursal */}
          {hasSwitchBranchPerm && branches.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 bg-base-200/50 p-1.5 sm:p-2.5 rounded-xl border border-[#d1d5db] dark:border-white/200 hover:border-primary transition-all flex-1 sm:flex-initial sm:w-auto max-w-full sm:max-w-xs shrink-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Store size={18} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <select
                  className="select select-bordered select-xs sm:select-sm w-full bg-base-100 font-bold text-xs sm:text-sm text-base-content truncate pl-2 sm:pl-3 pr-6 sm:pr-8 focus:border-primary focus:outline-none"
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={!!editSale}
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
      </div>

      {/* Búsqueda de Productos y Tabla de Carrito (Ancho Completo) */}
      <div className="space-y-6">

        {/* Tarjeta de Búsqueda */}
        {/* Componente Buscador Optimizado (Nombre, SKU, Barcode, Cámara) */}
        <div className="bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-sm">
          <CommercialProductSearchBar
            onSearchBarcode={handleScanBarcode}
            onSelectSuggestion={handleSelectSuggestion}
            branchId={hasSwitchBranchPerm && selectedBranchId ? selectedBranchId : undefined}
            placeholder="Buscar producto por nombre o escanear..."
          />
        </div>

        {/* LISTADO DE PRODUCTOS: MOBILE (Cards independientes) & DESKTOP (Tabla en contenedor) */}
        {items.length === 0 ? (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center text-base-content/40 space-y-3">
            <ShoppingCart size={44} className="stroke-1 text-base-content/20" />
            <p className="text-sm font-medium">El carrito está vacío</p>
            <p className="text-xs text-base-content/40 max-w-xs">
              Utiliza el buscador superior para agregar productos al pedido actual.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA MOBILE: Cards Independientes en el flujo de la página */}
            <div className="block md:hidden space-y-3">
              {/* Cabecera Mobile */}
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-xs uppercase tracking-wide text-base-content flex items-center gap-1.5">
                  <ShoppingCart size={15} className="text-primary shrink-0" /> Productos en Pedido ({items.length})
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1 font-semibold"
                  title="Vaciar Carrito"
                >
                  <Trash2 size={13} />
                  Vaciar
                </button>
              </div>

              {/* Listado de Cards de Productos */}
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const factor = item.equivalenceFactor || 1;
                  const totalUnits = item.quantity * factor;
                  const maxDiscount = (item.discountPrice != null && item.discountPrice < item.salePrice)
                    ? item.salePrice - item.discountPrice
                    : 0;
                  const hasDiscountLimit = maxDiscount > 0;
                  const totalDiscount = item.discountAmount * totalUnits;
                  const subtotal = item.salePrice * totalUnits;
                  const finalTotal = subtotal - totalDiscount;
                  const isExpanded = !!expandedItems[item.productVariantId];

                  return (
                    <div
                      key={`mobile-${item.productVariantId}-${item.priceTypeId}`}
                      className="p-3.5 space-y-2.5 bg-base-100 rounded-2xl border border-base-200 shadow-sm"
                    >
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
                            className="select select-bordered select-xs w-full font-bold text-xs text-base-content rounded-lg px-3 truncate"
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
                            className={`btn btn-ghost btn-xs gap-1 pl-0 h-5 min-h-0 hover:bg-transparent text-error ${item.discountAmount > 0 ? 'font-bold' : 'font-semibold text-error/80 hover:text-error'
                              }`}
                          >
                            <Tag size={12} className="text-error shrink-0" />
                            <span className="text-[11px] text-error">
                              {item.discountAmount > 0
                                ? `Desc: -${currency} ${totalDiscount.toFixed(2)}`
                                : (isExpanded ? 'Cerrar descuento' : '+ Agregar descuento')}
                            </span>
                            {isExpanded ? <ChevronUp size={12} className="text-error" /> : <ChevronDown size={12} className="text-error" />}
                          </button>
                        </div>
                      )}

                      {/* Acordeón Desplegable de Descuento (Contraste notorio y profundidad) */}
                      {hasDiscountLimit && isExpanded && (
                        <div className="bg-base-200/90 dark:bg-base-300/80 rounded-xl p-3 border border-error shadow-sm text-xs mt-1.5 transition-all">
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
            </div>

            {/* VISTA DESKTOP: Tabla completa en contenedor con cabecera */}
            <div className="hidden md:block bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
              <div className="p-3.5 sm:p-4 border-b border-base-200 flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wide text-base-content flex items-center gap-2">
                  <ShoppingCart size={16} className="text-primary shrink-0" /> Productos en Pedido ({items.length})
                </span>
                <ComerziaButton
                  variant="delete"
                  label="Vaciar Carrito"
                  icon={<Trash2 size={14} />}
                  className="btn-xs px-2 sm:px-3 min-w-0"
                  responsive={true}
                  tooltip="Vaciar Carrito"
                  onClick={clearCart}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200/50 border-b border-base-200 text-xs font-semibold uppercase">
                      <th className="w-8">#</th>
                      <th>Producto</th>
                      <th>Presentación</th>
                      <th className="text-center w-36">Cantidad</th>
                      <th className="text-right">Precio Unit.</th>
                      <th className="text-right">Subtotal</th>
                      <th className="text-right text-error font-bold">Descuento</th>
                      <th className="text-right bg-primary/5 font-bold text-primary">Importe Final</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const factor = item.equivalenceFactor || 1;
                      const totalUnits = item.quantity * factor;
                      const maxDiscount = (item.discountPrice != null && item.discountPrice < item.salePrice)
                        ? item.salePrice - item.discountPrice
                        : 0;
                      const hasDiscountLimit = maxDiscount > 0;
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
                              className="select select-bordered select-xs w-full max-w-[120px] px-3"
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
                              <div className="flex flex-col items-end gap-1">
                                {!expandedItems[item.productVariantId] ? (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedItems(prev => ({ ...prev, [item.productVariantId]: true }))}
                                    className={`btn btn-ghost btn-xs gap-1 pl-0 h-5 min-h-0 hover:bg-transparent text-error ${item.discountAmount > 0 ? 'font-bold' : 'font-semibold text-error/80 hover:text-error'}`}
                                  >
                                    <Tag size={12} className="text-error shrink-0" />
                                    <span className="text-[11px] text-error whitespace-nowrap">
                                      {item.discountAmount > 0
                                        ? `Desc: -${currency} ${totalDiscount.toFixed(2)}`
                                        : '+ Agregar descuento'}
                                    </span>
                                    <ChevronDown size={12} className="text-error" />
                                  </button>
                                ) : (
                                  <div className="bg-base-200/90 dark:bg-base-300/80 rounded-xl p-2 border border-error shadow-sm text-xs flex flex-col items-end gap-1 relative">
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs min-h-0 h-5 w-5 p-0 rounded-full text-base-content/40 hover:text-error absolute -top-2 -right-2 bg-base-100 border border-base-300 shadow-xs"
                                      onClick={() => setExpandedItems(prev => ({ ...prev, [item.productVariantId]: false }))}
                                      title="Cerrar opciones de descuento"
                                    >
                                      <X size={12} />
                                    </button>
                                    <ProductDiscountControl
                                      item={item}
                                      currency={currency}
                                      updateDiscount={updateDiscount}
                                      updateTotalDiscount={updateTotalDiscount}
                                      toastWarning={toastWarning}
                                      compact={true}
                                    />
                                  </div>
                                )}
                              </div>
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
            label={editSale ? 'Actualizar Venta' : 'Enviar a Caja'}
            icon={<ArrowRight size={24} />}
            className="shadow-xl shadow-primary/20 text-base sm:text-lg font-bold py-4 px-8 w-full md:w-auto h-auto rounded-2xl"
            disabled={items.length === 0}
            onClick={handleSendToRegister}
          />
        </div>
      </div>


    </div>
  );
};
