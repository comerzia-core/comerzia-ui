export interface SaleDetailRequest {
  productVariantId: string;
  priceTypeId: string;
  unitQuantity: number;
  unitDiscountAmount: number;
}

export interface CreateSaleRequest {
  branchId: string;
  customerId?: string | null;
  expectedTotalAmount: number;
  details: SaleDetailRequest[];
}

export interface UpdateSaleRequest {
  customerId?: string | null;
  expectedTotalAmount: number;
  details: SaleDetailRequest[];
}

export interface SaleDetailResponse {
  id: string;
  unitSalePrice: number;
  unitDiscountAmount: number;
  unitFinalPrice: number;
  unitQuantity: number;
  finalQuantity: number;
  priceTypeId: string;
  productVariantId: string;
  productName?: string;
  variantName?: string;
}

export interface SalePaymentResponse {
  id: string;
  amount: number;
  changeAmount: number;
  date: string;
  paymentType: number; // 701, 702, 703, 704
  employeeId: string;
}

export interface SaleResponse {
  id: string;
  subtotalAmount: number;
  discountedAmount: number;
  totalAmount: number;
  date: string;
  saleStatus: number; // 601 (PENDING), 602 (COMPLETED), 603 (CANCELLED), etc.
  customerId: string | null;
  customerName?: string;
  employeeId: string;
  details: SaleDetailResponse[];
  payments: SalePaymentResponse[];
}

export interface PageSaleResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: SaleResponse[];
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ReturnDetailRequest {
  saleDetailId: string;
  quantityToReturn: number;
}

export interface CreateReturnRequest {
  reason: string;
  returnDetails: ReturnDetailRequest[];
}

export interface ReturnDetailResponse {
  id: string;
  saleDetailId: string;
  quantity: number;
  refundAmount: number;
}

export interface ReturnResponse {
  id: string;
  saleId: string;
  totalRefundAmount: number;
  reason: string;
  date: string;
  details: ReturnDetailResponse[];
}

export interface CustomerProfileResponse {
  id: string;
  personId: string;
  customerType: number; // 611, 612
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  documentType?: number; // 101, 102, 103, 104
  documentNumber?: string;
  documentExtension?: number; // 201..209
}

export interface CreateCustomerRequest {
  saleId?: string | null;
  customerType: number;
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  phoneNumber?: string;
  email?: string;
  documentType?: number;
  documentNumber?: string;
  documentExtension?: number;
}

export interface UpdateCustomerRequest {
  customerType: number;
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  phoneNumber?: string;
  email?: string;
  documentType?: number;
  documentNumber?: string;
  documentExtension?: number;
}

export interface PageCustomerProfileResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: CustomerProfileResponse[];
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Búsqueda de catálogo
export interface SalesCatalogItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barCode: string;
  stock: number;
  salePrice: number;
  discountPrice: number; // Precio mínimo permitido tras descuento
  priceTypeId: string;
  priceTypeName: string;
  equivalenceFactor: number;
}
