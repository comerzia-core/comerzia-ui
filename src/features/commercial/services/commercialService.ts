import api from '../../../lib/axios';
import type { 
  CategoryResponse, 
  SegmentResponse, 
  BrandResponse, 
  ProductResponse,
  ProductVariantResponse,
  FamilyResponse,
  PriceTypeResponse,
  SalePriceResponse,
  CreateFullProductRequest,
  CreateFamilyGroupRequest,
  AddProductsToFamilyRequest,
  ScannerProductResponse,
  PageStockEntryResponse,
  CreateStockEntryRequest,
  PageStockAdjustmentResponse,
  CreateInventoryRequest,
  SaveInventoryDraftRequest,
  ApproveInventoryRequest,
  PageProductResponse,
  PageProductVariantResponse,
  PageInventoryResponse,
  PageSalePriceResponse,
  ChangePriceRequest
} from '../types/commercial';

export const commercialService = {
  // Categories
  getCategories: async (): Promise<CategoryResponse[]> => {
    const response = await api.get('/tenant/categories');
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
  getSegmentsByCategory: async (categoryId: string): Promise<SegmentResponse[]> => {
    const response = await api.get(`/tenant/segments/category/${categoryId}`);
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
  getBrandsBySegment: async (segmentId: string): Promise<BrandResponse[]> => {
    const response = await api.get(`/tenant/brands/segment/${segmentId}`);
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

  // Products
  getProductsByBrand: async (brandId: string, page = 0, size = 20): Promise<PageProductResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/products/brand/${brandId}?${params.toString()}`);
    return response.data;
  },

  // Product Variants
  getVariantsByProduct: async (productId: string, page = 0, size = 20): Promise<PageProductVariantResponse> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/product-variants/product/${productId}?${params.toString()}`);
    return response.data;
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

  createStockEntry: async (data: CreateStockEntryRequest): Promise<void> => {
    await api.post('/tenant/stock/entries', data);
  },

  // Stock Adjustments
  getStockAdjustments: async (variantId: string, page = 0, size = 20): Promise<PageStockAdjustmentResponse> => {
    const params = new URLSearchParams({ variantId, page: String(page), size: String(size) });
    const response = await api.get(`/tenant/stock-adjustments?${params.toString()}`);
    return response.data;
  },

  // Sale Prices
  getSalePricesByVariant: async (variantId: string, page = 0, size = 20): Promise<PageSalePriceResponse> => {
    // Assuming this endpoint exists based on the requirements
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await api.get(`/tenant/sale-prices/variant/${variantId}?${params.toString()}`);
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
