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

  addItem: (item, quantity = 1, discountAmount = 0) => {
    const { items } = get();
    const existing = items.find((i) => i.productVariantId === item.productVariantId);

    if (existing) {
      const newQty = existing.quantity + quantity;
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
      if (quantity > item.stock) {
        return { 
          success: false, 
          message: `Stock insuficiente. Disponible: ${item.stock}` 
        };
      }
      set({
        items: [...items, { ...item, quantity, discountAmount }]
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

    if (quantity > item.stock) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, quantity: item.stock } : i
        )
      });
      return { 
        success: false, 
        message: `La cantidad solicitada supera el stock disponible. Ajustado al máximo: ${item.stock}` 
      };
    }

    if (quantity < 1) {
      return { success: false, message: 'La cantidad mínima es 1' };
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

    // El descuento unitario no puede hacer que el precio final sea menor al discountPrice
    // Precio Final = salePrice - discountAmount
    // Queremos: salePrice - discountAmount >= discountPrice
    // Es decir: discountAmount <= salePrice - discountPrice
    const maxDiscount = item.salePrice - item.discountPrice;
    if (discountAmount > maxDiscount) {
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

    if (discountAmount < 0) {
      return { success: false, message: 'El descuento no puede ser negativo.' };
    }

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId ? { ...i, discountAmount } : i
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

    const unitDiscount = totalDiscountAmount / item.quantity;
    return updateDiscount(productVariantId, unitDiscount);
  },

  updatePriceType: (productVariantId, priceTypeId) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado' };

    const newPrice = item.activePrices.find(p => p.priceTypeId === priceTypeId);
    if (!newPrice) return { success: false, message: 'Tipo de precio no válido' };

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId
          ? {
              ...i,
              priceTypeId: newPrice.priceTypeId,
              priceTypeName: newPrice.priceTypeName,
              salePrice: newPrice.salePrice,
              discountPrice: newPrice.discountPrice,
              equivalenceFactor: newPrice.equivalenceFactor,
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
