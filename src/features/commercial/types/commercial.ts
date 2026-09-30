export interface CategoryResponse {
  id: string;
  name: string;
  status: boolean;
}

export interface CatalogAvailabilityResponse {
  available: boolean;
  exists: boolean;
  message: string;
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
  variantName: string;
  status: boolean;
  brand: BrandResponse;
}

export interface ProductVariantResponse {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barCode: string;
  isInternalBarcode?: boolean;
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
  description?: string;
  equivalenceFactor: number;
}

export interface SalePriceResponse {
  id: string;
  priceType?: PriceTypeResponse;
  priceTypeId?: string;
  priceTypeName?: string;
  equivalenceFactor?: number;
  basePrice?: number;
  salePrice: number;
  discountPrice?: number | null;
  validFrom?: string;
  validTo?: string | null;
}

export interface VariantPriceItemRequest {
  priceTypeId: string;
  salePrice: number;
  discountPrice?: number | null;
}

export interface SyncVariantPricesRequest {
  prices: VariantPriceItemRequest[];
}

export interface CreateInitialPriceRequest {
  priceTypeId: string;
  salePrice: number;
  discountPrice: number;
}

export interface CreateFullVariantRequest {
  name: string;
  description?: string;
  sku: string;
  barCode: string;
  isInternalBarcode: boolean;
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
  discountPrice: number;
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
  activePrices: ScannerPriceResponse[];
  totalAvailableStock: number;
  stockByBranch: ScannerStockBranchResponse[];
}

export interface ScannerSiblingVariantResponse {
  variantId: string;
  variantName: string;
  sku: string;
  barCode: string;
  imageUrl?: string;
}

export interface ScannerProductResponse {
  productId: string;
  productName: string;
  description?: string;
  brandName: string;
  scannedVariant: ScannerVariantDetailResponse;
  otherVariants: ScannerSiblingVariantResponse[];
}

export interface ProductVariantIdentityResponse {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl?: string;
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
  statusType?: { code: number; label: string } | number;
  branchName?: string;
  hasAdjustments?: boolean;
}

export interface PendingCostEntryResponse {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barCode: string;
  imageUrl?: string;
  quantityIn: number;
  availableQuantity: number;
  reservedQuantity: number;
  unitCost: number;
  totalCost: number;
  entryDate: string;
  note?: string;
  statusType?: { code: number; label: string } | number;
  branchName?: string;
  hasAdjustments?: boolean;
}

export interface BranchQuantityRequest {
  branchId: string;
  quantityIn: number;
}

export interface CreateStockEntryRequest {
  variantId: string;
  quantityIn?: number;
  unitCost: number;
  totalCost?: number;
  note?: string;
  branchDistributions?: BranchQuantityRequest[];
}

export interface ValuateStockRequest {
  unitCost: number;
  totalCost: number;
}

export interface CreateManualAdjustmentRequest {
  stockId: string;
  quantity: number;
  adjustmentType: number;
  observation: string;
}

export interface StockAdjustmentResponse {
  id: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  adjustmentType: { code: number; label: string } | number;
  observation?: string;
  date: string;
  employeeName?: string;
  inventoryId?: string | null;
  branchName?: string;
}

export interface InventoryResponse {
  id: string;
  assignedEmployeeId?: string;
  assignedAt?: string;
  uploadedAt?: string;
  imageUrl?: string;
  staffNotes?: string;
  approvedEmployeeId?: string;
  adminNotes?: string;
  statusType?: { code: number; label: string } | number;
  segmentId?: string;
  segmentName?: string;
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

export interface PagePendingCostEntryResponse {
  content: PendingCostEntryResponse[];
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

export interface VariantWithPricesResponse {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barCode: string;
  activePrices: SalePriceResponse[];
}

export interface SalePriceTrendResponse {
  id: string;
  salePrice: number;
  discountPrice?: number;
  previousPrice?: number;
  variationPercentage?: number;
  validFrom: string;
  validTo?: string | null;
  date?: string; // added for chart mapping
}

export interface SalePriceHistoryResponse {
  id: string;
  salePrice: number;
  discountPrice?: number;
  previousPrice?: number;
  variationPercentage?: number;
  validFrom: string;
  validTo?: string | null;
}

export interface PageSalePriceHistoryResponse {
  content: SalePriceHistoryResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ChangePriceRequest {
  priceTypeId: string;
  salePrice: number;
  discountPrice?: number;
  variantId: string;
}

// Bulk Upload & Enrichment Types
export interface BulkProductUploadRequest {
  autoGenerateInternalBarcodes: boolean;
}

export interface BulkUploadRowError {
  rowNumber: number;
  productName: string;
  variantName: string;
  barcode?: string | null;
  errorCode: string;
  errorMessage: string;
}

export interface BulkUploadSummaryResponse {
  totalRowsProcessed: number;
  successfulRows: number;
  failedRows: number;
  totalProductsCreated: number;
  totalVariantsCreated: number;
  totalVariantsUpdated: number;
  missingBarcodesCount: number;
  missingImagesCount: number;
  errors?: BulkUploadRowError[] | null;
}

export interface ProductVariantEnrichmentResponse {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  barCode: string | null;
  imageUrl: string | null;
  isInternalBarcode: boolean;
  missingBarcode: boolean;
  missingImage: boolean;
}

export interface PageProductVariantEnrichmentResponse {
  content: ProductVariantEnrichmentResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Replenishment & Stock Reports
export interface ReplenishmentMetricsResponse {
  totalVariantsEvaluated: number;
  outOfStockCount: number;
  lowStockCount: number;
  healthyStockCount: number;
  overStockCount: number;
}

export interface ReplenishmentReportResponse {
  id?: string;
  variantId: string;
  variantName: string;
  productName: string;
  sku: string;
  barCode: string;
  imageUrl?: string | null;
  categoryName?: string;
  segmentName?: string;
  brandName?: string;
  currentStock: number;
  minStock: number;
  idealStock: number;
  suggestedOrderQuantity: number;
  status: { code: number; label: string } | number | string;
}

export interface PageReplenishmentReportResponse {
  content: ReplenishmentReportResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface VariantSettingItemRequest {
  variantId: string;
  minStock: number;
  idealStock: number;
}

export interface UpdateBranchVariantSettingsRequest {
  branchId: string;
  settings: VariantSettingItemRequest[];
}

// Valuation & Financial Inventory Reports
export interface ValuationMetricsResponse {
  totalUnits: number;
  totalCost: number;
  totalPotentialRevenue: number;
  totalPotentialProfit: number;
  averageMarginPercentage: number;
}

export interface ValuationCategoryChartItem {
  categoryId: string;
  categoryName: string;
  totalCost: number;
  potentialRevenue: number;
  percentage: number;
}

export interface ValuationBranchChartItem {
  branchId: string;
  branchName: string;
  totalCost: number;
  potentialRevenue: number;
  totalUnits: number;
}

export type ValuationDistributionType = 'CATEGORY' | 'SEGMENT' | 'BRAND' | 'PRODUCT';

export interface ValuationChartsResponse {
  distributionType?: ValuationDistributionType | string;
  categoryDistribution: ValuationCategoryChartItem[];
  branchDistribution: ValuationBranchChartItem[];
}

export interface ValuationReportResponse {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barCode: string;
  imageUrl?: string | null;
  categoryName?: string;
  segmentName?: string;
  brandName?: string;
  totalQuantity: number;
  averageUnitCost: number;
  totalCost: number;
  salePrice: number;
  potentialRevenue: number;
  potentialProfit: number;
  marginPercentage: number;
}

export interface PageValuationReportResponse {
  content: ValuationReportResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Demand Forecasting & BI Intelligence
export interface DemandBcgItem {
  id: string;
  name: string;
  velocity: number;
  marginPercentage: number;
  totalSales: number;
}

export interface DemandTrendItem {
  dateGroup: string;
  totalSales: number;
}

export interface DemandChartsResponse {
  distributionType?: string;
  trendChart: DemandTrendItem[];
  bcgMatrix: DemandBcgItem[];
}

export interface DemandMetricsResponse {
  globalVelocity: number;
  averageDaysRemaining: number;
  deadStockCapital: number;
  turnoverRate: number;
}

export type DemandRotationStatus = 'HIGH' | 'MEDIUM' | 'LOW' | 'DEAD';
export type DemandSuggestedAction = 'REORDER' | 'MAINTAIN' | 'PROMOTE' | 'LIQUIDATE' | 'HOLD';

export interface DemandReportResponse {
  variantId: string;
  variantName: string;
  productName: string;
  sku: string;
  barCode: string;
  imageUrl?: string | null;
  categoryName?: string;
  segmentName?: string;
  brandName?: string;
  currentStock: number;
  dailyVelocity: number;
  daysRemaining: number | null;
  rotationStatus: DemandRotationStatus | string;
  suggestedAction: DemandSuggestedAction | string;
  marginPercentage?: number;
}

export interface PageDemandReportResponse {
  content: DemandReportResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}


