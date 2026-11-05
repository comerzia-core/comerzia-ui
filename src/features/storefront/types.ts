export interface Page<T> { content: T[]; number: number; size: number; totalPages: number; totalElements: number }
export interface Facet { id: string; name: string; parentId: string | null }
export interface Catalog {
  slug: string; canonicalSlug: string; title: string; description: string; template: 'STUDIO' | 'BOUTIQUE' | 'MENU';
  theme: 'light' | 'dark'; whatsapp: string; currency: string; logoUrl: string | null; paymentQrUrl: string | null;
  facets: { categories: Facet[]; segments: Facet[]; brands: Facet[] };
}
export interface ProductCard { id: string; name: string; brand: string; imageUrl: string | null; fromPrice: number; variantCount: number }
export interface SalePrice { id: string; name: string; equivalenceFactor: number; salePrice: number }
export interface Variant { id: string; name: string; description: string | null; imageUrl: string | null; prices: SalePrice[] }
export interface Product { id: string; name: string; description: string | null; brand: string; variants: Variant[]; variantPage: number; variantPages: number; variantCount: number }
export interface Draft { revision: number; slug: string; title: string; description: string; template: Catalog['template']; whatsappCountry: string; whatsapp: string; showPaymentQr: boolean }
export interface Administration { eligible: boolean; published: boolean; publicUrl: string | null; draft: Draft; templates: { code: Draft['template']; label: string; description: string }[] }
export interface VariantSelection { id: string; productName: string; name: string; imageUrl: string | null; visible: boolean; active: boolean }
export interface CartLine { variantId: string; priceTypeId: string; name: string; presentation: string; quantity: number; unitPrice: number; imageUrl: string | null }
export interface CheckoutLine { variantId: string; priceTypeId: string; name: string; presentation: string; quantity: number; unitPrice: number; total: number }
export interface Checkout { items: CheckoutLine[]; total: number; currency: string; whatsapp: string; paymentQrUrl: string | null; message: string }
export interface Filters { q: string; category: string; segment: string; brand: string; minPrice: string; maxPrice: string; order: string; page: number }

export interface CatalogAccess { eligible: boolean }
export interface PhoneCountry { code: string; name: string; callingCode: string; suggestedTimezone: string | null }
export interface Classification { categories: Facet[]; segments: Facet[]; brands: Facet[] }
export interface SelectionFilters { category: string; segment: string; brand: string }
export interface ProductSelection { id: string; name: string; brand: string; imageUrl: string | null; variantCount: number; visibleVariantCount: number; visible: boolean | null }
export interface ScopeVisibility { total: number; visible: number; enabled: boolean | null }
export interface SelectionVisibility { category: ScopeVisibility | null; segment: ScopeVisibility | null; brand: ScopeVisibility | null }
export type VisibilityLevel = 'CATEGORY' | 'SEGMENT' | 'BRAND';
