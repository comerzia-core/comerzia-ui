import { create } from 'zustand';
import type { SalesCatalogItem } from '../types/sales';

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

  addItem: (item, quantity, discountAmount = 0) => {
    const { items } = get();
    const existing = items.find((i) => i.productVariantId === item.productVariantId);
    const initialQty = quantity !== undefined ? quantity : (item.equivalenceFactor || 1);

    if (existing) {
      const newQty = existing.quantity + initialQty;
      if (newQty > item.stock) {
        return { 
          success: false, 
          message: `Stock insuficiente. Disponible: ${item.stock}` 
        };
      }
      set({
        items: items.map((i) =>
          i.productVariantId === item.productVariantId ? { ...i, quantity: newQty, discountAmount } : i
        )
      });
      return { success: true };
    } else {
      if (initialQty > item.stock) {
        return { 
          success: false, 
          message: `Stock insuficiente. Disponible: ${item.stock}` 
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

    // 1. Validar límite de stock
    if (quantity > item.stock) {
      let maxMultiple = Math.floor(item.stock / factor) * factor;
      if (maxMultiple < factor) maxMultiple = item.stock;

      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, quantity: maxMultiple } : i
        )
      });
      return { 
        success: false, 
        message: `La cantidad solicitada supera el stock disponible. Ajustado al máximo permitido: ${maxMultiple}` 
      };
    }

    // 2. Validar cantidad mínima
    if (quantity < factor) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, quantity: factor } : i
        )
      });
      return { 
        success: false, 
        message: `La cantidad mínima para ${item.priceTypeName || 'esta unidad'} es ${factor}.` 
      };
    }

    // 3. Validar que sea múltiplo exacto del factor
    if (quantity % factor !== 0) {
      let adjustedQty = Math.round(quantity / factor) * factor;
      if (adjustedQty < factor) adjustedQty = factor;
      if (adjustedQty > item.stock) adjustedQty = Math.floor(item.stock / factor) * factor;

      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, quantity: adjustedQty } : i
        )
      });
      return {
        success: false,
        message: `La cantidad para ${item.priceTypeName || 'esta unidad'} debe ser múltiplo de ${factor} (ej: ${factor}, ${factor * 2}, ${factor * 3}). Se ajustó a ${adjustedQty}.`
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

    if (cleanDiscount > maxDiscount) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, discountAmount: maxDiscount } : i
        )
      });
      return { 
        success: false, 
        message: `El descuento supera el límite autorizado. Ajustado al máximo permitido: $${maxDiscount.toFixed(2)}` 
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

    if (item.quantity === 0) {
      return { success: false, message: 'La cantidad debe ser mayor a 0 para aplicar descuento total' };
    }

    const cleanTotalDiscount = Number(Number(totalDiscountAmount).toFixed(2));
    const unitDiscount = Number((cleanTotalDiscount / item.quantity).toFixed(2));
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
        message: `No se puede seleccionar ${newPrice.priceTypeName} porque su factor (${newFactor}) excede el stock disponible (${item.stock}).`
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
              quantity: newFactor,
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
    return get().items.reduce((acc, i) => acc + i.salePrice * i.quantity, 0);
  },

  getDiscountedAmount: () => {
    return get().items.reduce((acc, i) => acc + i.discountAmount * i.quantity, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountedAmount();
    return subtotal - discount;
  }
}));
