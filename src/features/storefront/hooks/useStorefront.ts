import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogService } from '../services/catalogService';
import type { CartLine, Filters, SalePrice, Variant } from '../types';

const emptyFilters: Filters = { q: '', category: '', segment: '', brand: '', minPrice: '', maxPrice: '', order: 'name', page: 0 };

export function useStorefront(slug: string, preview: boolean) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const catalog = useQuery({ queryKey: ['storefront', preview ? 'preview' : slug], queryFn: ({ signal }) => catalogService.catalog(slug, preview, signal), staleTime: 0, retry: false });
  const canonicalSlug = catalog.data?.canonicalSlug || slug;
  useEffect(() => { setFilters(emptyFilters); setSearch(''); }, [slug, preview]);
  useEffect(() => {
    const timeout = setTimeout(() => setFilters(current => current.q === search ? current : { ...current, q: search, page: 0 }), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const products = useQuery({ queryKey: ['storefront-products', preview ? 'preview' : slug, filters], enabled: !!catalog.data,
    queryFn: ({ signal }) => catalogService.products(slug, preview, filters, signal), placeholderData: keepPreviousData, retry: false });
  useEffect(() => {
    if (preview) return;
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem('store-cart:' + canonicalSlug) || '[]');
      setCart(Array.isArray(stored) ? stored.filter((line: unknown): line is CartLine => {
        if (!line || typeof line !== 'object') return false;
        const item = line as Partial<CartLine>;
        return typeof item.variantId === 'string' && typeof item.priceTypeId === 'string' && typeof item.name === 'string'
          && typeof item.presentation === 'string' && typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice) && item.unitPrice > 0
          && typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999;
      }).slice(0, 60) : []);
    } catch { setCart([]); }
  }, [canonicalSlug, preview]);
  const updateCart = (next: CartLine[]) => { setCart(next); if (!preview) { try { sessionStorage.setItem('store-cart:' + canonicalSlug, JSON.stringify(next)); } catch { /* El carrito sigue disponible en memoria. */ } } };
  const add = (productName: string, variant: Variant, price: SalePrice, quantity: number) => {
    const existing = cart.find(line => line.variantId === variant.id && line.priceTypeId === price.id);
    if (!existing && cart.length >= 60) return false;
    const line: CartLine = { variantId: variant.id, priceTypeId: price.id, name: productName + ' · ' + variant.name,
      presentation: price.name, quantity: Math.min(999, quantity + (existing?.quantity || 0)), unitPrice: price.salePrice, imageUrl: variant.imageUrl };
    updateCart(existing ? cart.map(item => item === existing ? line : item) : [...cart, line]);
    return true;
  };
  const quantity = (variant: string, type: string, value: number) => updateCart(cart.flatMap(line => {
    if (line.variantId !== variant || line.priceTypeId !== type) return [line];
    return value <= 0 ? [] : [{ ...line, quantity: Math.min(999, Math.floor(value)) }];
  }));
  const filter = (key: keyof Filters, value: string | number) => setFilters(current => ({ ...current, [key]: value, ...(key === 'page' ? {} : { page: 0 }),
    ...(key === 'category' ? { segment: '', brand: '' } : key === 'segment' ? { brand: '' } : {}) }));
  return { catalog, products, filters, filter, search, setSearch, cart, add, quantity, canonicalSlug };
}
