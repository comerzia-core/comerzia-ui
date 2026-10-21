import type { SalesCatalogItem } from '../types/sales';

export const getCartLineKey = (item: SalesCatalogItem): string => `${item.productVariantId}:${item.priceTypeId}`;

export const toCents = (amount: number): number => Math.round(amount * 100);
export const fromCents = (amount: number): number => amount / 100;

export const getLineSubtotal = (item: SalesCatalogItem, quantity: number): number =>
  fromCents(toCents(item.salePrice) * quantity * (item.equivalenceFactor || 1));

export const getMaximumLineDiscount = (item: SalesCatalogItem, quantity: number): number => {
  const unitLimit = item.discountPrice != null
    ? Math.max(0, toCents(item.salePrice) - toCents(item.discountPrice)) : 0;
  return fromCents(unitLimit * quantity * (item.equivalenceFactor || 1));
};

export const isMoneyAmount = (amount: number): boolean =>
  Number.isFinite(amount) && amount >= 0 && Number.isSafeInteger(toCents(amount))
  && amount === fromCents(toCents(amount));
