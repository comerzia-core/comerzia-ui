import api from '../../../lib/axios';
import type { 
  CategoryResponse, 
  SegmentResponse, 
  BrandResponse, 
  ProductResponse,
  ProductVariantResponse,
  FamilyResponse,
  PriceTypeResponse,
  CreateFullProductRequest,
  CreateFamilyGroupRequest,
  AddProductsToFamilyRequest,
  ScannerProductResponse,
  PageStockEntryResponse,
  PagePendingCostEntryResponse,
  CreateStockEntryRequest,
  PageStockAdjustmentResponse,
  CreateInventoryRequest,
  SaveInventoryDraftRequest,
  ApproveInventoryRequest,
  PageProductResponse,
  PageProductVariantResponse,
  PageInventoryResponse,
  PageSalePriceResponse,
  PageSalePriceHistoryResponse,
  SalePriceTrendResponse,
  ChangePriceRequest,
  CreateManualAdjustmentRequest,
  ValuateStockRequest,
  VariantWithPricesResponse,
  SalePriceResponse,
  InventoryResponse
} from '../types/commercial';

export const commercialService = {
  // Categories
  getCategories: async (activeOnly?: boolean): Promise<CategoryResponse[]> => {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));
    const response = await api.get(`/tenant/categories${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },
  
  createCategory: async (name: string): Promise<CategoryResponse> => {
    const response = await api.post('/tenant/categories', { name });
    return response.data;
  },

  updateCategory: async (id: string, name: string, status: boolean): Promise<CategoryResponse> => {
    const response = await api.put(`/tenant/categories/${id}`, { name, status });
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/tenant/categories/${id}`);
  },

  // Segments
  getSegmentsByCategory: async (categoryId: string, activeOnly?: boolean): Promise<SegmentResponse[]> => {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));
    const response = await api.get(`/tenant/segments/category/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  createSegment: async (name: string, categoryId: string): Promise<SegmentResponse> => {
    const response = await api.post('/tenant/segments', { name, categoryId });
    return response.data;
  },

  updateSegment: async (id: string, name: string, status: boolean, categoryId: string): Promise<SegmentResponse> => {
    const response = await api.put(`/tenant/segments/${id}`, { name, status, categoryId }); 
    return response.data;
  },

  deleteSegment: async (id: string): Promise<void> => {
    await api.delete(`/tenant/segments/${id}`);
  },

  // Brands
  getBrandsBySegment: async (segmentId: string, activeOnly?: boolean): Promise<BrandResponse[]> => {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));
    const response = await api.get(`/tenant/brands/segment/${segmentId}${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  createBrand: async (name: string, segmentId: string): Promise<BrandResponse> => {
    const response = await api.post('/tenant/brands', { name, segmentId });
    return response.data;
  },

  updateBrand: async (id: string, name: string, status: boolean, segmentId: string): Promise<BrandResponse> => {
    const response = await api.put(`/tenant/brands/${id}`, { name, status, segmentId });
    return response.data;
  },

  deleteBrand: async (id: string): Promise<void> => {
    await api.delete(`/tenant/brands/${id}`);
  },

  getProducts: async (filters: { categoryId?: string; segmentId?: string; brandId?: string; page?: number; size?: number; activeOnly?: boolean } = {}): Promise<PageProductResponse> => {
    const params = new URLSearchParams();
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.segmentId) params.append('segmentId', filters.segmentId);
    if (filters.brandId) params.append('brandId', filters.brandId);
    if (filters.page !== undefined) params.append('page', String(filters.page));
    if (filters.size !== undefined) params.append('size', String(filters.size));
    if (filters.activeOnly !== undefined) params.append('activeOnly', String(filters.activeOnly));
    const response = await api.get(`/tenant/products${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  updateProduct: async (id: string, data: any): Promise<ProductResponse> => {
    const response = await api.put(`/tenant/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/tenant/products/${id}`);
  },

  getVariantsByProduct: async (productId: string, page = 0, size = 20, activeOnly?: boolean): Promise<PageProductVariantResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (activeOnly !== undefined) {
      params.append('activeOnly', String(activeOnly));
    }
    const response = await api.get(`/tenant/product-variants/product/${productId}?${params.toString()}`);
    return response.data;
  },

  createProductVariant: async (data: any): Promise<ProductVariantResponse> => {
    const response = await api.post('/tenant/product-variants', data);
    return response.data;
  },

  updateProductVariant: async (id: string, data: any): Promise<ProductVariantResponse> => {
    const response = await api.put(`/tenant/product-variants/${id}`, data);
    return response.data;
  },

  deleteProductVariant: async (id: string): Promise<void> => {
    await api.delete(`/tenant/product-variants/${id}`);
  },

  // Catalog Master (Families)
  getFamilies: async (): Promise<FamilyResponse[]> => {
    const response = await api.get('/tenant/families');
    return response.data;
  },

  createFamilyGroup: async (data: CreateFamilyGroupRequest): Promise<void> => {
    await api.post('/tenant/catalog/families', data);
  },

  addProductsToFamily: async (familyId: string, data: AddProductsToFamilyRequest): Promise<void> => {
    await api.post(`/tenant/catalog/families/${familyId}/products`, data);
  },

  // Catalog Master (Full Product)
  createFullProduct: async (data: CreateFullProductRequest): Promise<ProductResponse> => {
    const response = await api.post('/tenant/catalog/products', data);
    return response.data;
  },

  // Scanner
  scanBarcode: async (barcode: string): Promise<ScannerProductResponse> => {
    const response = await api.get(`/tenant/scanner/${barcode}`);
    return response.data;
  },

  // Stock Entries
  getStockEntries: async (variantId: string, page = 0, size = 20): Promise<PageStockEntryResponse> => {
    const params = new URLSearchParams({ variantId, page: String(page), size: String(size) });
    const response = await api.get(`/tenant/stock/entries?${params.toString()}`);
    return response.data;
  },

  createStockEntry: async (data: CreateStockEntryRequest, branchId?: string): Promise<void> => {
    const headers: Record<string, string> = {};
    if (branchId) {
      headers['X-Branch-Context'] = branchId;
    }
    await api.post('/tenant/stock/entries', data, { headers });
  },

  valuateStockEntry: async (stockId: string, data: ValuateStockRequest): Promise<void> => {
    await api.patch(`/tenant/stock/entries/${stockId}/cost`, data);
  },

  getPendingCostEntries: async (page = 0, size = 10): Promise<PagePendingCostEntryResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/stock/entries/pending-cost?${params.toString()}`);
    return response.data;
  },

  // Stock Adjustments
  getStockAdjustments: async (variantId: string | undefined, page = 0, size = 20): Promise<PageStockAdjustmentResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (variantId) params.append('variantId', variantId);
    const response = await api.get(`/tenant/stock-adjustments?${params.toString()}`);
    return response.data;
  },

  getAdjustmentsByStockId: async (stockId: string, page = 0, size = 20): Promise<PageStockAdjustmentResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/stock-adjustments/stock/${stockId}?${params.toString()}`);
    return response.data;
  },

  createManualAdjustment: async (data: CreateManualAdjustmentRequest): Promise<void> => {
    await api.post('/tenant/stock-adjustments', data);
  },

  // Sale Prices
  getPricesByBarcode: async (barcode: string): Promise<VariantWithPricesResponse> => {
    const response = await api.get(`/tenant/sale-prices/variant/barcode/${barcode}`);
    return response.data;
  },

  getSalePricesByVariant: async (variantId: string, page = 0, size = 20): Promise<PageSalePriceResponse> => {
    // Legacy endpoint if needed
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/sale-prices/variant/${variantId}?${params.toString()}`);
    return response.data;
  },

  getActiveSalePricesByVariant: async (variantId: string): Promise<SalePriceResponse[]> => {
    const response = await api.get(`/tenant/sale-prices/variant/${variantId}/active`);
    return response.data;
  },

  getSalePriceHistory: async (variantId: string, priceTypeId: string, page = 0, size = 5): Promise<PageSalePriceHistoryResponse> => {
    const params = new URLSearchParams({ priceTypeId, page: String(page), size: String(size) });
    const response = await api.get(`/tenant/sale-prices/variant/${variantId}?${params.toString()}`);
    return response.data;
  },

  getSalePriceTrend: async (variantId: string, priceTypeId: string, months = 6): Promise<SalePriceTrendResponse[]> => {
    const params = new URLSearchParams({ priceTypeId, months: String(months) });
    const response = await api.get(`/tenant/sale-prices/variant/${variantId}/trend?${params.toString()}`);
    return response.data;
  },

  getPriceTypes: async (): Promise<PriceTypeResponse[]> => {
    // Endpoints dynamic for price-types as requested by user
    const response = await api.get('/tenant/price-types');
    return response.data;
  },

  changePrice: async (data: ChangePriceRequest): Promise<void> => {
    await api.post('/tenant/sale-prices', data);
  },

  // Inventories
  getInventories: async (page = 0, size = 20): Promise<PageInventoryResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/inventories?${params.toString()}`);
    return response.data;
  },

  getInventoryById: async (id: string): Promise<InventoryResponse> => {
    const response = await api.get(`/tenant/inventories/${id}`);
    return response.data;
  },

  getMyInventoryTasks: async (page = 0, size = 20): Promise<PageInventoryResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/inventories/my-tasks?${params.toString()}`);
    return response.data;
  },

  createInventory: async (data: CreateInventoryRequest): Promise<void> => {
    await api.post('/tenant/inventories', data);
  },

  saveInventoryDraft: async (id: string, data: SaveInventoryDraftRequest): Promise<void> => {
    await api.put(`/tenant/inventories/${id}/draft`, data);
  },

  approveInventory: async (id: string, data: ApproveInventoryRequest): Promise<void> => {
    await api.post(`/tenant/inventories/${id}/approve`, data);
  }
};
