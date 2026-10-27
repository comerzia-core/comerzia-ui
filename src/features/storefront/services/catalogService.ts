import axios from 'axios';
import api from '../../../lib/axios';
import { publicApi } from '../../public/services/publicService';
import type { Administration, Catalog, Draft, Page, Product, ProductCard, VariantSelection, Filters, CartLine, Checkout, CatalogAccess, PhoneCountry, Classification, ProductSelection, SelectionFilters, SelectionVisibility, VisibilityLevel } from '../types';

export const catalogService = {
  access: async (): Promise<CatalogAccess> => (await api.get('/tenant/public-catalog/access')).data,
  phoneCountries: async (): Promise<PhoneCountry[]> => (await api.get('/tenant/public-catalog/phone-countries')).data,
  facets: async (): Promise<Classification> => (await api.get('/tenant/public-catalog/facets')).data,
  selection: async (q: string, filters: SelectionFilters, page: number, size: number, signal?: AbortSignal): Promise<Page<ProductSelection>> =>
    (await api.get('/tenant/public-catalog/products', { params: { q, ...filters, page, size }, signal })).data,
  selectionVisibility: async (filters: SelectionFilters, signal?: AbortSignal): Promise<SelectionVisibility> =>
    (await api.get('/tenant/public-catalog/selection-visibility', { params: filters, signal })).data,
  productVariants: async (id: string, page: number, size: number, signal?: AbortSignal): Promise<Page<VariantSelection>> =>
    (await api.get('/tenant/public-catalog/products/' + encodeURIComponent(id) + '/variants', { params: { page, size }, signal })).data,
  productVisibility: async (id: string, visible: boolean): Promise<void> => { await api.put('/tenant/public-catalog/products/' + encodeURIComponent(id) + '/visibility', { visible }); },
  scopeVisibility: async (level: VisibilityLevel, reference: string, visible: boolean): Promise<void> => { await api.put('/tenant/public-catalog/scope-visibility', { level, reference, visible }); },
  administration: async (): Promise<Administration> => (await api.get('/tenant/public-catalog')).data,
  save: async (draft: Draft): Promise<Administration> => (await api.put('/tenant/public-catalog', draft)).data,
  publish: async (revision: number, published: boolean): Promise<Administration> => (await api.post('/tenant/public-catalog/' + (published ? 'publish' : 'unpublish'), { revision })).data,
  variants: async (q: string, page: number, size = 20): Promise<Page<VariantSelection>> => (await api.get('/tenant/public-catalog/variants', { params: { q, page, size } })).data,
  visibility: async (variantIds: string[], visible: boolean): Promise<void> => { await api.put('/tenant/public-catalog/visibility', { variantIds, visible }); },
  catalog: async (slug: string, preview: boolean, signal?: AbortSignal): Promise<Catalog> =>
    (await (preview ? api : publicApi).get(preview ? '/tenant/public-catalog/preview' : '/public/catalogs/' + encodeURIComponent(slug), { signal })).data,
  products: async (slug: string, preview: boolean, filters: Filters, signal?: AbortSignal): Promise<Page<ProductCard>> =>
    (await (preview ? api : publicApi).get(preview ? '/tenant/public-catalog/preview/products' : '/public/catalogs/' + encodeURIComponent(slug) + '/products', {
      signal, params: { ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')), size: 24 },
    })).data,
  product: async (slug: string, preview: boolean, id: string, signal?: AbortSignal, variantPage = 0): Promise<Product> =>
    (await (preview ? api : publicApi).get((preview ? '/tenant/public-catalog/preview' : '/public/catalogs/' + encodeURIComponent(slug)) + '/products/' + encodeURIComponent(id), { signal, params: { variantPage } })).data,
  checkout: async (slug: string, lines: CartLine[]): Promise<Checkout> =>
    (await publicApi.post('/public/catalogs/' + encodeURIComponent(slug) + '/checkout', { items: lines.map(({ variantId, priceTypeId, quantity }) => ({ variantId, priceTypeId, quantity })) })).data,
};

export function catalogError(error: unknown): string {
  const code: unknown = axios.isAxiosError<{ code?: string }>(error) ? error.response?.data.code : undefined;
  const messages: Record<string, string> = {
    catalog_slug_unavailable: 'Esa dirección ya está en uso.', catalog_revision_conflict: 'La configuración cambió. Vuelve a cargar.',
    catalog_subscription_required: 'Necesitas una suscripción activa.', catalog_unavailable: 'El catálogo o producto ya no está disponible.',
    catalog_invalid: 'Revisa la dirección, WhatsApp y opciones elegidas.', catalog_rate_limited: 'Espera un momento e intenta otra vez.',
    catalog_phone_invalid: 'Revisa el número local de WhatsApp.',
    catalog_filters_invalid: 'Revisa el rango de precios y los filtros.',
  };
  return typeof code === 'string' && Object.hasOwn(messages, code) ? messages[code] : 'No se pudo completar. Intenta nuevamente.';
}
