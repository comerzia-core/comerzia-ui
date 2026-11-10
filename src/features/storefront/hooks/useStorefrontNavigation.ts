import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Filters } from '../types';

export interface ProductNavigationSelection { variant: string; priceType: string; variantPage: number }
const pageNumber = (value: string | null) => value && /^\d{1,5}$/.test(value) ? Math.min(Number(value), 10000) : 0;
const reference = (value: string | null) => value && /^[A-Za-z0-9]{1,80}$/.test(value) ? value : '';

export function useStorefrontNavigation() {
  const [params, setParams] = useSearchParams();
  const currentParams = useRef(params);
  currentParams.current = params;
  const filters: Filters = {
    q: (params.get('q') || '').slice(0, 80), category: reference(params.get('category')),
    segment: reference(params.get('segment')), brand: reference(params.get('brand')),
    minPrice: params.get('minPrice') || '', maxPrice: params.get('maxPrice') || '',
    order: ['price-asc', 'price-desc'].includes(params.get('order') || '') ? params.get('order')! : 'name',
    page: pageNumber(params.get('page')),
  };
  const [search, setSearch] = useState(filters.q);
  const update = useCallback((values: Record<string, string | number>, replace = false) => {
    const next = new URLSearchParams(currentParams.current);
    for (const [key, value] of Object.entries(values)) {
      if (value === '' || value === 0 || key === 'order' && value === 'name') next.delete(key);
      else next.set(key, String(value));
    }
    if (next.toString() === currentParams.current.toString()) return;
    currentParams.current = next;
    setParams(next, { replace, preventScrollReset: true });
  }, [setParams]);

  useEffect(() => { setSearch(filters.q); }, [filters.q]);
  useEffect(() => {
    if (search === filters.q) return;
    const timeout = setTimeout(() => update({ q: search, page: 0 }, true), 300);
    return () => clearTimeout(timeout);
  }, [search, filters.q, update]);

  const filter = (key: keyof Filters, value: string | number) => update({
    [key]: value, ...(key === 'page' ? {} : { page: 0 }),
    ...(key === 'category' ? { segment: '', brand: '' } : key === 'segment' ? { brand: '' } : {}),
  });
  const openProduct = useCallback((product: string | null) => update({
    product: product || '', variant: '', priceType: '', variantPage: 0,
  }), [update]);
  const selectProduct = useCallback((selection: ProductNavigationSelection, replace = false) => update({ ...selection }, replace), [update]);
  const selection: ProductNavigationSelection = { variant: reference(params.get('variant')),
    priceType: reference(params.get('priceType')), variantPage: pageNumber(params.get('variantPage')) };

  return { filters, filter, search, setSearch, product: reference(params.get('product')) || null,
    openProduct, selection, selectProduct };
}
