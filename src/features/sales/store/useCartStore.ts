import { create } from 'zustand';
import type { SalesCatalogItem } from '../types/sales';
import { useAuthStore } from '../../../stores/useAuthStore';

export interface CartItem extends SalesCatalogItem {
  quantity: number;
  discountAmount: number; // Descuento unitario ingresado por el vendedor
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  branchId: string | null;

  addItem: (item: SalesCatalogItem, quantity?: number, discountAmount?: number) => { success: boolean; message?: string };
  removeItem: (productVariantId: string) => void;
  updateQuantity: (productVariantId: string, quantity: number) => { success: boolean; message?: string };
  updateDiscount: (productVariantId: string, discountAmount: number) => { success: boolean; message?: string };
  updateTotalDiscount: (productVariantId: string, totalDiscountAmount: number) => { success: boolean; message?: string };
  updatePriceType: (productVariantId: string, priceTypeId: string) => { success: boolean; message?: string };
  setCustomer: (customerId: string | null, customerName: string | null) => void;
  setBranchId: (branchId: string | null) => void;
  clearCart: () => void;

  // Selectores útiles
  getSubtotal: () => number;
  getDiscountedAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  branchId: null,

  addItem: (item, quantity = 1, discountAmount = 0) => {
    const { items } = get();
    const existing = items.find((i) => i.productVariantId === item.productVariantId);
    const initialQty = quantity ?? 1;
    const factor = item.equivalenceFactor || 1;
    const maxPackages = Math.floor(item.stock / factor);

    if (existing) {
      const newQty = existing.quantity + initialQty;
      if (newQty * factor > item.stock) {
        return { 
          success: false, 
          message: `Stock insuficiente. Disponible: ${item.stock} unidades.` 
          // message: `Stock insuficiente. Disponible: ${item.stock} unidades. Para ${item.priceTypeName || 'esta unidad'} (factor ${factor}), el máximo es ${maxPackages} (${maxPackages * factor} unidades).` 
        };
      }
      set({
        items: items.map((i) =>
          i.productVariantId === item.productVariantId ? { ...i, quantity: newQty, discountAmount } : i
        )
      });
      return { success: true };
    } else {
      if (initialQty * factor > item.stock) {
        const adjustedQty = maxPackages > 0 ? maxPackages : 1;
        set({
          items: [...items, { ...item, quantity: adjustedQty, discountAmount }]
        });
        return { 
          success: false, 
          message: `Stock insuficiente. Disponible: ${item.stock} unidades.` 
          // message: `Stock insuficiente. Disponible: ${item.stock} unidades. Para ${item.priceTypeName || 'esta unidad'} (factor ${factor}), el máximo es ${maxPackages} (${maxPackages * factor} unidades).` 
        };
      }
      set({
        items: [...items, { ...item, quantity: initialQty, discountAmount }]
      });
      return { success: true };
    }
  },

  removeItem: (productVariantId) => {
    set({
      items: get().items.filter((i) => i.productVariantId !== productVariantId)
    });
  },

  updateQuantity: (productVariantId, quantity) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado' };

    const factor = item.equivalenceFactor || 1;
    const maxPackages = Math.floor(item.stock / factor);

    // 1. Validar cantidad mínima
    if (quantity < 1) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, quantity: 1 } : i
        )
      });
      return { success: false, message: 'La cantidad mínima es 1.' };
    }

    // 2. Validar límite de stock total en unidades físicas (cantidad * factor)
    if (quantity * factor > item.stock) {
      const adjustedQty = maxPackages > 0 ? maxPackages : 1;
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, quantity: adjustedQty } : i
        )
      });
      return { 
        success: false, 
        message: `Stock insuficiente. Disponible: ${item.stock} unidades.` 
        // message: `Stock insuficiente. Disponible: ${item.stock} unidades. El máximo para ${item.priceTypeName || 'esta unidad'} (factor ${factor}) es ${adjustedQty} (${adjustedQty * factor} unidades).` 
      };
    }

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId ? { ...i, quantity } : i
      )
    });
    return { success: true };
  },

  updateDiscount: (productVariantId, discountAmount) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado' };

    // Si discountPrice es igual a salePrice, no se permiten descuentos
    if (item.discountPrice === item.salePrice) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, discountAmount: 0 } : i
        )
      });
      return { success: false, message: 'Este producto no admite descuentos manuales.' };
    }

    const cleanDiscount = Number(Number(discountAmount).toFixed(2));
    const maxDiscount = Number((item.salePrice - item.discountPrice).toFixed(2));
    const currency = useAuthStore.getState().userProfile?.companySettings?.currencyCode || 'USD';

    if (cleanDiscount > maxDiscount) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, discountAmount: maxDiscount } : i
        )
      });
      return { 
        success: false, 
        message: `El descuento supera el límite autorizado. Máximo permitido: ${currency} ${maxDiscount.toFixed(2)}` 
      };
    }

    if (cleanDiscount < 0) {
      return { success: false, message: 'El descuento no puede ser negativo.' };
    }

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId ? { ...i, discountAmount: cleanDiscount } : i
      )
    });
    return { success: true };
  },

  updateTotalDiscount: (productVariantId, totalDiscountAmount) => {
    const { items, updateDiscount } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado' };

    const totalUnits = item.quantity * (item.equivalenceFactor || 1);
    if (totalUnits === 0) {
      return { success: false, message: 'La cantidad debe ser mayor a 0 para aplicar descuento total' };
    }

    const cleanTotalDiscount = Number(Number(totalDiscountAmount).toFixed(2));
    const unitDiscount = Number((cleanTotalDiscount / totalUnits).toFixed(2));
    return updateDiscount(productVariantId, unitDiscount);
  },

  updatePriceType: (productVariantId, priceTypeId) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado' };

    const newPrice = item.activePrices.find(p => p.priceTypeId === priceTypeId);
    if (!newPrice) return { success: false, message: 'Tipo de precio no válido' };

    const newFactor = newPrice.equivalenceFactor || 1;

    if (newFactor > item.stock) {
      return {
        success: false,
        message: `No se puede seleccionar ${newPrice.priceTypeName} porque su factor (${newFactor}) excede el stock disponible (${item.stock} unidades).`
      };
    }

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId
          ? {
              ...i,
              priceTypeId: newPrice.priceTypeId,
              priceTypeName: newPrice.priceTypeName,
              salePrice: newPrice.salePrice,
              discountPrice: newPrice.discountPrice,
              equivalenceFactor: newFactor,
              quantity: 1,
              discountAmount: 0
            }
          : i
      )
    });
    return { success: true };
  },

  setCustomer: (customerId, customerName) => {
    set({ customerId, customerName });
  },

  setBranchId: (branchId) => {
    set({ branchId });
  },

  clearCart: () => {
    set({ items: [], customerId: null, customerName: null });
  },

  getSubtotal: () => {
    return get().items.reduce((acc, i) => acc + i.salePrice * i.quantity * (i.equivalenceFactor || 1), 0);
  },

  getDiscountedAmount: () => {
    return get().items.reduce((acc, i) => acc + i.discountAmount * i.quantity * (i.equivalenceFactor || 1), 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountedAmount();
    return subtotal - discount;
  }
}));
