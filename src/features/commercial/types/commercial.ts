export interface CategoryResponse {
  id: string;
  name: string;
  status: boolean;
}

export interface SegmentResponse {
  id: string;
  name: string;
  status: boolean;
  category: CategoryResponse;
}

export interface BrandResponse {
  id: string;
  name: string;
  status: boolean;
  segment: SegmentResponse;
}

export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  variantType: number;
  status: boolean;
  brand: BrandResponse;
}

export interface ProductVariantResponse {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barCode: string;
  imageUrl?: string;
  status: boolean;
  product: ProductResponse;
}

export interface FamilyResponse {
  id: string;
  name: string;
  description?: string;
  status: boolean;
}

export interface PriceTypeResponse {
  id: string;
  name: string;
  equivalenceFactor: number;
}

export interface SalePriceResponse {
  id: string;
  priceType: PriceTypeResponse;
  basePrice: number;
  salePrice: number;
  discountPrice: number;
  validFrom: string;
  validTo?: string | null;
}

export interface CreateInitialPriceRequest {
  priceTypeId: string;
  basePrice: number;
  salePrice: number;
  discountPrice: number;
}

export interface CreateFullVariantRequest {
  name: string;
  description?: string;
  sku: string;
  barCode: string;
  imageUrl?: string;
  prices: CreateInitialPriceRequest[];
}

export interface CreateFullProductRequest {
  name: string;
  description?: string;
  variantType: number;
  brandId: string;
  variants: CreateFullVariantRequest[];
}

export interface CreateFamilyGroupRequest {
  name: string;
  description?: string;
  productIds: string[];
}

export interface AddProductsToFamilyRequest {
  productIds: string[];
}

export interface ScannerPriceResponse {
  priceTypeId: string;
  priceTypeName: string;
  equivalenceFactor: number;
  salePrice: number;
}

export interface ScannerStockBranchResponse {
  branchId: string;
  branchName: string;
  availableQuantity: number;
  isCurrentBranch: boolean;
}

export interface ScannerVariantDetailResponse {
  variantId: string;
  variantName: string;
  sku: string;
  barCode: string;
  imageUrl?: string;
  isScannedVariant: boolean;
  activePrices: ScannerPriceResponse[];
  totalAvailableStock: number;
  stockByBranch: ScannerStockBranchResponse[];
}

export interface ScannerProductResponse {
  productId: string;
  productName: string;
  description?: string;
  brandName: string;
  variants: ScannerVariantDetailResponse[];
}

export interface StockEntryResponse {
  id: string;
  quantityIn: number;
  availableQuantity: number;
  reservedQuantity: number;
  unitCost: number;
  totalCost: number;
  entryDate: string;
  note?: string;
  status: boolean;
  variantId: string;
}

export interface CreateStockEntryRequest {
  variantId: string;
  quantityIn: number;
  unitCost: number;
  note?: string;
}

export interface StockAdjustmentResponse {
  id: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  adjustmentType: number;
  observation: string;
  date: string;
  stockId: string;
  inventoryId?: string;
  employeeId: string;
}

export interface InventoryResponse {
  id: string;
  assignedEmployeeId: string;
  assignedAt: string;
  uploadedAt?: string;
  imageUrl?: string;
  staffNotes?: string;
  approvedEmployeeId?: string;
  adminNotes?: string;
  statusType: number;
  segmentId: string;
  segmentName: string;
}

export interface CreateInventoryRequest {
  segmentId: string;
  assignedEmployeeId: string;
}

export interface SaveInventoryDraftRequest {
  staffNotes?: string;
  imageUrl?: string;
}

export interface StockDifferenceDTO {
  stockId: string;
  countedQuantity: number;
  observation?: string;
}

export interface ApproveInventoryRequest {
  adminNotes?: string;
  differences: StockDifferenceDTO[];
}

// Pagination responses
export interface PageProductResponse {
  content: ProductResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PageStockEntryResponse {
  content: StockEntryResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PageStockAdjustmentResponse {
  content: StockAdjustmentResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PageInventoryResponse {
  content: InventoryResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PageProductVariantResponse {
  content: ProductVariantResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PageSalePriceResponse {
  content: SalePriceResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ChangePriceRequest {
  priceTypeId: string;
  basePrice: number;
  salePrice: number;
  discountPrice: number;
  variantId: string;
}
