import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/useAuthStore';
import { catalogService, catalogError } from '../services/catalogService';
import type { SelectionFilters, VisibilityLevel } from '../types';

export function useCatalogSelection() {
  const company = useAuthStore(state => state.userProfile?.companySettings?.id);
  const cache = useQueryClient();
  const [filters, setFilters] = useState<SelectionFilters>({ category: '', segment: '', brand: '' });
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(0); }, 300); return () => clearTimeout(timer); }, [search]);
  const facets = useQuery({ queryKey: ['catalog-selection', company, 'facets'], queryFn: catalogService.facets });
  const products = useQuery({ queryKey: ['catalog-selection', company, 'products', filters, query, page, pageSize],
    queryFn: ({ signal }) => catalogService.selection(query, filters, page, pageSize, signal), placeholderData: keepPreviousData });
  const summary = useQuery({ queryKey: ['catalog-selection', company, 'summary', filters],
    queryFn: ({ signal }) => catalogService.selectionVisibility(filters, signal) });
  const refresh = async () => {
    await Promise.all([cache.invalidateQueries({ queryKey: ['catalog-selection', company] }),
      cache.invalidateQueries({ queryKey: ['catalog-variants', company] }),
      cache.invalidateQueries({ queryKey: ['storefront-products'] }), cache.invalidateQueries({ queryKey: ['store-product'] })]);
  };
  const mutate = async (operation: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await operation(); await refresh(); }
    catch (failure: unknown) { setError(catalogError(failure)); }
    finally { setBusy(false); }
  };
  const filter = (key: keyof SelectionFilters, value: string) => {
    setFilters(current => ({ ...current, [key]: value, ...(key === 'category' ? { segment: '', brand: '' } : key === 'segment' ? { brand: '' } : {}) })); setPage(0);
  };
  const scope = (level: VisibilityLevel, reference: string, visible: boolean) => mutate(() => catalogService.scopeVisibility(level, reference, visible));
  const product = (id: string, visible: boolean) => mutate(() => catalogService.productVisibility(id, visible));
  const variant = (id: string, visible: boolean) => mutate(() => catalogService.visibility([id], visible));
  return { facets, products, summary, filters, filter, search, setSearch, page, setPage, pageSize, setPageSize, busy, error, scope, product, variant };
}
