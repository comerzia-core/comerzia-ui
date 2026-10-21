import { useState, useEffect } from 'react';
import type { CartItem } from '../store/useCartStore';
import { getMaximumLineDiscount, toCents } from '../utils/cartPricing';

interface Props {
  item: CartItem;
  updateDiscount: (id: string, amount: number, priceTypeId?: string) => { success: boolean; message?: string };
  toastWarning: (message: string) => void;
}

export const useProductDiscount = ({ item, updateDiscount, toastWarning }: Props) => {
  const [draft, setDraft] = useState<string | undefined>();
  const [shakeKey, setShakeKey] = useState(0);

  // Sincronizar el valor mostrado: si está escribiendo usa el draft; si no, el formateado del item
  const value = draft !== undefined ? draft : (item.lineTotalDiscount ? item.lineTotalDiscount.toFixed(2) : '');

  // Resetear el borrador si cambia el producto, presentación o cantidad desde el exterior
  useEffect(() => {
    setDraft(undefined);
  }, [item.productVariantId, item.priceTypeId, item.quantity]);

  const handleChange = (raw: string) => {
    // Permitir coma o punto decimal
    const normalized = raw.replace(',', '.');

    // Validación de entrada: permitir solo dígitos y hasta 2 decimales
    if (normalized !== '' && !/^\d*(\.\d{0,2})?$/.test(normalized)) {
      return;
    }

    setDraft(raw);

    // Calcular el monto en tiempo real a medida que el usuario escribe
    let amount = 0;
    if (normalized === '' || normalized === '.') {
      amount = 0;
    } else if (normalized.endsWith('.')) {
      amount = Number(normalized.slice(0, -1)) || 0;
    } else {
      amount = Number(normalized);
    }

    if (!isNaN(amount)) {
      // Actualizamos el carrito de inmediato para recalcular subtotal, descuento y total general en tiempo real
      updateDiscount(item.productVariantId, amount, item.priceTypeId);
    }
  };

  const commit = () => {
    const text = (draft !== undefined ? draft : (item.lineTotalDiscount ? item.lineTotalDiscount.toString() : '')).trim().replace(',', '.');
    let amount = (text === '' || text === '.') ? 0 : /^\d+(\.\d{0,2})?$/.test(text) ? Number(text) : Number.NaN;
    const maximum = getMaximumLineDiscount(item, item.quantity);

    // Si el usuario coloca un monto superior al descuento máximo permitido, ajustarlo automáticamente al máximo
    if (!isNaN(amount) && toCents(amount) > toCents(maximum)) {
      amount = maximum;
      toastWarning(`Se ajustó al descuento máximo permitido (${maximum.toFixed(2)}).`);
    }

    const result = updateDiscount(item.productVariantId, amount, item.priceTypeId);
    if (!result.success) {
      setShakeKey((key) => key + 1);
      if (result.message) toastWarning(result.message);
    } else {
      setDraft(undefined);
    }
  };

  return {
    value,
    setValue: handleChange,
    commit,
    shakeKey,
    maximum: getMaximumLineDiscount(item, item.quantity)
  };
};
