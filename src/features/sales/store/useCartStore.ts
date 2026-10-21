import { create } from 'zustand';
import type { SalesCatalogItem } from '../types/sales';
import { fromCents, getLineSubtotal, getMaximumLineDiscount, isMoneyAmount, toCents } from '../utils/cartPricing';

export interface CartItem extends SalesCatalogItem {
  quantity: number;
  lineTotalDiscount: number; // Descuento total de la línea; se conserva al aumentar la cantidad.
  discountError?: string;
}

interface CartStore {
  items: CartItem[];
  branchId: string | null;
  setBranchId: (branchId: string | null) => void;
  addItem: (product: SalesCatalogItem, quantity?: number, lineTotalDiscount?: number) => OperationResult;
  removeItem: (productVariantId: string, priceTypeId?: string) => void;
  updateQuantity: (productVariantId: string, quantity: number, priceTypeId?: string) => OperationResult;
  updateDiscount: (productVariantId: string, lineTotalDiscount: number, priceTypeId?: string) => OperationResult;
  updatePriceType: (productVariantId: string, priceTypeId: string, currentPriceTypeId?: string) => OperationResult;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscountedAmount: () => number;
  getTotal: () => number;
}
interface OperationResult { success: boolean; message?: string }

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  branchId: null,
  setBranchId: (branchId) => set({ branchId }),
  addItem: (product, quantity = 1, lineTotalDiscount = 0) => {
    const factor = product.equivalenceFactor || 1;
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(quantity * factor)) {
      return { success: false, message: 'Ingresa una cantidad entera.' };
    }
    const existing = get().items.find((item) =>
      item.productVariantId === product.productVariantId && item.priceTypeId === product.priceTypeId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity * factor > product.stock) {
      return { success: false, message: `Stock disponible: ${product.stock} unidades.` };
    }
    const discount = existing?.lineTotalDiscount ?? lineTotalDiscount;
    if (!isMoneyAmount(discount) || toCents(discount) > toCents(getMaximumLineDiscount(existing ?? product, nextQuantity))) {
      return { success: false, message: 'Revisa el descuento del producto.' };
    }
    if (existing) {
      set({ items: get().items.map((item) => item === existing
        ? { ...item, quantity: nextQuantity, stock: product.stock } : item) });
    } else {
      set({ items: [...get().items, { ...product, quantity, lineTotalDiscount: discount }] });
    }
    return { success: true };
  },
  removeItem: (productVariantId, priceTypeId) => set({
    items: get().items.filter((item) => !(item.productVariantId === productVariantId && (priceTypeId === undefined || item.priceTypeId === priceTypeId))),
  }),
  updateQuantity: (productVariantId, quantity, priceTypeId) => {
    const item = get().items.find((entry) => entry.productVariantId === productVariantId && (priceTypeId === undefined || entry.priceTypeId === priceTypeId));
    if (!item) return { success: false, message: 'Producto no encontrado.' };
    if (!Number.isSafeInteger(quantity)) return { success: false, message: 'Ingresa una cantidad entera.' };
    if (quantity <= 0) {
      get().removeItem(productVariantId, item.priceTypeId);
      return { success: true };
    }
    const factor = item.equivalenceFactor || 1;
    if (!Number.isSafeInteger(quantity * factor) || quantity * factor > item.stock) {
      return { success: false, message: `Stock disponible: ${Math.floor(item.stock / factor)} presentaciones.` };
    }
    if (toCents(item.lineTotalDiscount) > toCents(getMaximumLineDiscount(item, quantity))) {
      return { success: false, message: 'Reduce el descuento antes de cambiar la cantidad.' };
    }
    set({ items: get().items.map((entry) => entry === item
      ? { ...entry, quantity } : entry) });
    return { success: true };
  },
  updateDiscount: (productVariantId, lineTotalDiscount, priceTypeId) => {
    const item = get().items.find((entry) => entry.productVariantId === productVariantId && (priceTypeId === undefined || entry.priceTypeId === priceTypeId));
    if (!item) return { success: false, message: 'Producto no encontrado.' };
    const maximum = getMaximumLineDiscount(item, item.quantity);
    const error = !isMoneyAmount(lineTotalDiscount) ? 'Ingresa un descuento con hasta dos decimales.'
      : toCents(lineTotalDiscount) > toCents(maximum) ? `Descuento máximo: ${maximum.toFixed(2)}.` : undefined;
    set({ items: get().items.map((entry) => entry === item
      ? { ...entry, lineTotalDiscount: error ? 0 : fromCents(toCents(lineTotalDiscount)), discountError: error } : entry) });
    return { success: !error, message: error };
  },
  updatePriceType: (productVariantId, priceTypeId, currentPriceTypeId) => {
    const item = get().items.find((entry) => entry.productVariantId === productVariantId && (currentPriceTypeId === undefined || entry.priceTypeId === currentPriceTypeId));
    if (!item) return { success: false, message: 'Producto no encontrado.' };
    if (priceTypeId === item.priceTypeId) return { success: true };
    if (get().items.some((entry) => entry !== item && entry.productVariantId === productVariantId && entry.priceTypeId === priceTypeId)) {
      return { success: false, message: 'Esa presentaci\u00f3n ya est\u00e1 en el carrito.' };
    }
    const price = item.activePrices.find((entry) => entry.priceTypeId === priceTypeId);
    if (!price) return { success: false, message: 'Tipo de precio no disponible.' };
    const factor = price.equivalenceFactor || 1;
    if (factor > item.stock) return { success: false, message: 'Stock insuficiente para esta presentación.' };
    // Otra presentación requiere revisar la cantidad y ofrecer un descuento nuevo.
    set({ items: get().items.map((entry) => entry === item
      ? { ...entry, priceTypeId: price.priceTypeId, priceTypeName: price.priceTypeName,
        salePrice: price.salePrice, discountPrice: price.discountPrice ?? null, equivalenceFactor: factor,
        quantity: 1, lineTotalDiscount: 0, discountError: undefined } : entry) });
    return { success: true };
  },
  setItems: (items) => set({ items }),
  clearCart: () => set({ items: [] }),
  getItemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getSubtotal: () => fromCents(get().items.reduce((total, item) =>
    total + toCents(getLineSubtotal(item, item.quantity)), 0)),
  getDiscountedAmount: () => fromCents(get().items.reduce((total, item) =>
    total + toCents(item.lineTotalDiscount), 0)),
  getTotal: () => fromCents(toCents(get().getSubtotal()) - toCents(get().getDiscountedAmount())),
}));
