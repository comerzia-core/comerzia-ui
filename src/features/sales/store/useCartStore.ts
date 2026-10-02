import { create } from 'zustand';
import type { SalesCatalogItem } from '../types/sales';
import { roundToTwo } from '../../../utils/currency';

export interface CartItem extends SalesCatalogItem {
  quantity: number;
  discountAmount: number; // Descuento unitario aplicado por pieza base
}

interface CartStore {
  items: CartItem[];
  branchId: string | null;

  // Acciones
  setBranchId: (branchId: string | null) => void;
  addItem: (product: SalesCatalogItem, quantity?: number, discountAmount?: number) => { success: boolean; message?: string };
  removeItem: (productVariantId: string) => void;
  updateQuantity: (productVariantId: string, quantity: number) => { success: boolean; message?: string };
  updateDiscount: (productVariantId: string, discountAmount: number) => { success: boolean; message?: string };
  updateTotalDiscount: (productVariantId: string, totalDiscountAmount: number) => { success: boolean; message?: string };
  updatePriceType: (productVariantId: string, priceTypeId: string) => { success: boolean; message?: string };
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;

  // Selectores y Cálculos
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscountedAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  branchId: null,

  setBranchId: (branchId: string | null) => set({ branchId }),

  addItem: (product: SalesCatalogItem, quantity = 1, discountAmount = 0) => {
    const { items } = get();
    const factor = product.equivalenceFactor || 1;
    const existingIndex = items.findIndex(
      (item) => item.productVariantId === product.productVariantId && item.priceTypeId === product.priceTypeId
    );

    // Validación de descuento máximo unitario permitido
    const maxDiscount = (product.discountPrice != null && product.discountPrice < product.salePrice)
      ? roundToTwo(product.salePrice - product.discountPrice)
      : 0;

    let validDiscount = roundToTwo(discountAmount);
    if (validDiscount > maxDiscount) {
      validDiscount = maxDiscount;
    }
    if (validDiscount < 0) {
      validDiscount = 0;
    }

    if (existingIndex > -1) {
      const currentItem = items[existingIndex];
      const newQuantity = currentItem.quantity + quantity;
      const totalUnits = newQuantity * factor;

      if (totalUnits > product.stock) {
        return {
          success: false,
          message: `Stock insuficiente. Disponible: ${product.stock} unidades.`
        };
      }

      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...currentItem,
        quantity: newQuantity,
        stock: product.stock,
        discountAmount: validDiscount
      };

      set({ items: updatedItems });
      return { success: true };
    }

    const totalUnits = quantity * factor;
    if (totalUnits > product.stock) {
      return {
        success: false,
        message: `Stock insuficiente. Disponible: ${product.stock} unidades.`
      };
    }

    set({
      items: [
        ...items,
        {
          ...product,
          quantity,
          discountAmount: validDiscount
        }
      ]
    });

    return { success: true };
  },

  removeItem: (productVariantId: string) => {
    set({
      items: get().items.filter((item) => item.productVariantId !== productVariantId)
    });
  },

  updateQuantity: (productVariantId: string, quantity: number) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado en el carrito.' };

    if (quantity <= 0) {
      set({
        items: items.filter((i) => i.productVariantId !== productVariantId)
      });
      return { success: true };
    }

    const factor = item.equivalenceFactor || 1;
    const totalUnits = quantity * factor;

    if (totalUnits > item.stock) {
      return {
        success: false,
        message: `Stock insuficiente. Máximo disponible: ${Math.floor(item.stock / factor)} paquetes (${item.stock} unidades).`
      };
    }

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId ? { ...i, quantity } : i
      )
    });

    return { success: true };
  },

  updateDiscount: (productVariantId: string, discountAmount: number) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado.' };

    // Límite de descuento: solo si discountPrice != null y discountPrice < salePrice
    const maxDiscount = (item.discountPrice != null && item.discountPrice < item.salePrice)
      ? roundToTwo(item.salePrice - item.discountPrice)
      : 0;

    if (maxDiscount <= 0) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, discountAmount: 0 } : i
        )
      });
      return { success: false, message: 'Este tipo de precio no admite descuentos manuales.' };
    }

    let validDiscount = roundToTwo(discountAmount);
    let warningMsg: string | undefined;

    if (validDiscount < 0) {
      validDiscount = 0;
    } else if (validDiscount > maxDiscount) {
      validDiscount = maxDiscount;
      warningMsg = `El descuento máximo permitido por unidad es ${maxDiscount.toFixed(2)}.`;
    }

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId ? { ...i, discountAmount: validDiscount } : i
      )
    });

    return { success: true, message: warningMsg };
  },

  updateTotalDiscount: (productVariantId: string, totalDiscountAmount: number) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado.' };

    const factor = item.equivalenceFactor || 1;
    const totalUnits = item.quantity * factor;

    const maxDiscountUnit = (item.discountPrice != null && item.discountPrice < item.salePrice)
      ? roundToTwo(item.salePrice - item.discountPrice)
      : 0;

    if (maxDiscountUnit <= 0) {
      set({
        items: items.map((i) =>
          i.productVariantId === productVariantId ? { ...i, discountAmount: 0 } : i
        )
      });
      return { success: false, message: 'Este tipo de precio no admite descuentos manuales.' };
    }

    const maxTotalDiscount = roundToTwo(maxDiscountUnit * totalUnits);
    let validTotal = roundToTwo(totalDiscountAmount);
    let warningMsg: string | undefined;

    if (validTotal < 0) {
      validTotal = 0;
    } else if (validTotal > maxTotalDiscount) {
      validTotal = maxTotalDiscount;
      warningMsg = `El descuento total máximo permitido es ${maxTotalDiscount.toFixed(2)}.`;
    }

    const unitDiscount = totalUnits > 0 ? roundToTwo(validTotal / totalUnits) : 0;

    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId ? { ...i, discountAmount: unitDiscount } : i
      )
    });

    return { success: true, message: warningMsg };
  },

  updatePriceType: (productVariantId: string, priceTypeId: string) => {
    const { items } = get();
    const item = items.find((i) => i.productVariantId === productVariantId);
    if (!item) return { success: false, message: 'Producto no encontrado.' };

    const newPrice = item.activePrices.find((p) => p.priceTypeId === priceTypeId);
    if (!newPrice) return { success: false, message: 'Tipo de precio no disponible.' };

    const newFactor = newPrice.equivalenceFactor || 1;
    if (newFactor > item.stock) {
      return {
        success: false,
        message: `Stock insuficiente para esta presentación (${newFactor} unids requeridas, ${item.stock} disponibles).`
      };
    }

    // Al cambiar la presentación o tipo de precio, reseteamos la cantidad a 1 y el descuento a 0
    set({
      items: items.map((i) =>
        i.productVariantId === productVariantId
          ? {
              ...i,
              priceTypeId: newPrice.priceTypeId,
              priceTypeName: newPrice.priceTypeName,
              salePrice: newPrice.salePrice,
              discountPrice: newPrice.discountPrice ?? null,
              equivalenceFactor: newFactor,
              quantity: 1,
              discountAmount: 0
            }
          : i
      )
    });

    return { success: true };
  },

  setItems: (items: CartItem[]) => set({ items }),

  clearCart: () => set({ items: [] }),

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return roundToTwo(
      get().items.reduce((total, item) => {
        const factor = item.equivalenceFactor || 1;
        const lineSubtotal = roundToTwo(item.salePrice * item.quantity * factor);
        return total + lineSubtotal;
      }, 0)
    );
  },

  getDiscountedAmount: () => {
    return roundToTwo(
      get().items.reduce((total, item) => {
        const factor = item.equivalenceFactor || 1;
        const lineDiscount = roundToTwo(item.discountAmount * item.quantity * factor);
        return total + lineDiscount;
      }, 0)
    );
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountedAmount();
    return roundToTwo(Math.max(0, subtotal - discount));
  }
}));
