// Interfaces y Tipos del Módulo de Ventas (Sales)

export interface ActivePriceResponse {
  id: string;
  salePrice: number;
  discountPrice?: number | null;
  priceTypeId: string;
  priceTypeName: string;
  equivalenceFactor: number;
}

export interface SalesProductResponse {
  variantId: string;
  sku: string;
  name: string;
  nameVariant: string;
  availableStock: number;
  activePrices: ActivePriceResponse[];
}

export interface SalesCatalogSuggestionResponse {
  variantId: string;
  label: string;
  barCode?: string;
  imageUrl?: string;
  description?: string;
}

export interface SalesCatalogItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barCode?: string;
  stock: number;
  priceTypeId: string;
  priceTypeName: string;
  salePrice: number;
  discountPrice?: number | null;
  equivalenceFactor: number;
  activePrices: ActivePriceResponse[];
}

export interface SaleDetailRequest {
  productVariantId: string;
  priceTypeId: string;
  receiptQuantity: number;
  lineDiscountAmount?: number;
}

export interface CreateSaleRequest {
  expectedTotalAmount: number;
  details: SaleDetailRequest[];
  customerId?: string;
  notes?: string;
}

export interface UpdateSaleRequest {
  expectedTotalAmount: number;
  details: SaleDetailRequest[];
  customerId?: string;
  notes?: string;
}

export interface SaleDetailResponse {
  id: string;
  productVariantId: string;
  productName: string;
  variantName?: string;
  sku?: string;
  priceTypeId?: string;
  priceTypeName?: string;
  measureUnitName?: string;
  unitQuantity?: number;
  receiptQuantity?: number;
  unitPrice?: number;
  unitSalePrice?: number;
  receiptUnitPrice?: number;
  unitFinalPrice?: number;
  lineDiscountAmount?: number;
  unitDiscountAmount?: number;
  lineTotalDiscount?: number;
  lineTotalSuggested?: number;
  lineTotalFinal?: number;
  subtotalAmount?: number;
  totalAmount?: number;
  equivalenceFactor?: number;
  returnedQuantity?: number;
}

export interface SalePaymentResponse {
  id: string;
  paymentType: number;
  amountPaid: number;
  changeAmount?: number;
  createdAt: string;
}

export interface CustomerProfileResponse {
  id: string;
  customerType: number;
  firstName: string;
  lastName?: string;
  paternalSurname?: string;
  maternalSurname?: string;
  businessName?: string;
  fullName?: string;
  documentType: number;
  documentNumber: string;
  documentExtension?: number;
  phoneNumber?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleResponse {
  id: string;
  saleNumber: string;
  status?: number | { code: number; label: string };
  saleStatus?: number | { code: number; label: string };
  date: string;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount?: number;
  discountedAmount: number;
  sellerUsername?: string;
  sellerFullName?: string;
  employeeUsername?: string;
  branchName?: string;
  branchId?: string;
  customerId?: string;
  customerName?: string;
  customerDocumentNumber?: string;
  customer?: CustomerProfileResponse;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  details: SaleDetailResponse[];
  payments?: SalePaymentResponse[];
}

export interface PageSaleResponse {
  content: SaleResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface SellerResponse {
  id: string;
  username: string;
  fullName: string;
}

export interface ReturnDetailItemRequest {
  saleDetailId: string;
  quantityToReturn?: number;
  returnQuantity?: number;
  reason?: string;
}

export interface CreateReturnRequest {
  saleId?: string;
  shiftId?: string;
  targetShiftId?: string;
  reason?: string;
  returnPaymentType?: number;
  notes?: string;
  details?: ReturnDetailItemRequest[];
  returnDetails?: ReturnDetailItemRequest[];
}

export interface ReturnDetailResponse {
  id: string;
  saleDetailId: string;
  productName: string;
  variantName?: string;
  returnQuantity: number;
  refundAmount: number;
  reason?: string;
}

export interface ReturnResponse {
  id: string;
  returnNumber: string;
  saleId: string;
  saleNumber: string;
  totalRefundAmount: number;
  reason?: string;
  createdAt: string;
  details: ReturnDetailResponse[];
}

export interface PaymentRequest {
  paymentType: number;
  amount?: number;
  amountPaid?: number;
  notes?: string;
}

export interface ProcessPaymentRequest {
  shiftId: string;
  payments: PaymentRequest[];
}

export interface CreateCustomerRequest {
  customerType: number;
  firstName: string;
  lastName?: string;
  paternalSurname?: string;
  maternalSurname?: string;
  businessName?: string;
  documentType?: number;
  documentNumber?: string;
  documentExtension?: number;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  customerType: number;
  firstName: string;
  lastName?: string;
  paternalSurname?: string;
  maternalSurname?: string;
  businessName?: string;
  documentType?: number;
  documentNumber?: string;
  documentExtension?: number;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export interface PageCustomerProfileResponse {
  content: CustomerProfileResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}
