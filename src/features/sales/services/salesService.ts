import api from '../../../lib/axios';
import type {
  SalesCatalogSuggestionResponse,
  SalesProductResponse,
  CreateSaleRequest,
  SaleResponse,
  SaleDetailResponse,
  PageSaleResponse,
  SellerResponse,
  UpdateSaleRequest,
  CreateReturnRequest,
  ReturnResponse,
  PageCustomerProfileResponse,
  CustomerProfileResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ProcessPaymentRequest,
  SaleBranchResponse
} from '../types/sales';

export const salesService = {
  quoteReturn: async (saleId: string, returnDetails: import('../types/sales').ReturnDetailItemRequest[], signal?: AbortSignal): Promise<import('../types/sales').ReturnQuoteResponse> => {
    const response = await api.post<import('../types/sales').ReturnQuoteResponse>(`/tenant/sales/${saleId}/return-quote`, { returnDetails }, { signal });
    return response.data;
  },
  getBranches: async (): Promise<SaleBranchResponse[]> => {
    const response = await api.get<SaleBranchResponse[]>('/tenant/sales/branches');
    return response.data;
  },

  getSuggestions: async (term: string, signal?: AbortSignal, branchId?: string | null): Promise<SalesCatalogSuggestionResponse[]> => {
    const params: Record<string, string> = { q: term };
    if (branchId) {
      params.branchId = branchId;
    }
    const response = await api.get<SalesCatalogSuggestionResponse[]>('/tenant/sales-catalog/suggestions', {
      params,
      signal
    });
    return response.data;
  },

  getProductDetailsById: async (variantId: string, branchId?: string | null): Promise<SalesProductResponse> => {
    const params = branchId ? { branchId } : undefined;
    const response = await api.get<SalesProductResponse>(`/tenant/sales-catalog/variants/${variantId}`, { params });
    return response.data;
  },

  getProductDetailsByBarcode: async (barcode: string, branchId?: string | null): Promise<SalesProductResponse> => {
    const params = branchId ? { branchId } : undefined;
    const response = await api.get<SalesProductResponse>(`/tenant/sales-catalog/barcodes/${encodeURIComponent(barcode)}`, { params });
    return response.data;
  },

  getProductDetailsBySku: async (sku: string, branchId?: string | null): Promise<SalesProductResponse> => {
    const params = branchId ? { branchId } : undefined;
    const response = await api.get<SalesProductResponse>(`/tenant/sales-catalog/skus/${encodeURIComponent(sku)}`, { params });
    return response.data;
  },

  // --- Ventas (Shift Sales & Sales History) ---
  createSale: async (data: CreateSaleRequest, branchId?: string | null): Promise<SaleResponse> => {
    const payload: CreateSaleRequest = {
      ...data,
      branchId: data.branchId !== undefined ? data.branchId : (branchId || null)
    };
    const response = await api.post<SaleResponse>('/tenant/sales', payload);
    return response.data;
  },

  findSales: async (page = 0, size = 10): Promise<PageSaleResponse> => {
    const response = await api.get<PageSaleResponse>('/tenant/sales', {
      params: { page, size }
    });
    return response.data;
  },

  searchSales: async (params: {
    startDate?: string;
    endDate?: string;
    sellerUsername?: string;
    page?: number;
    size?: number;
  }): Promise<PageSaleResponse> => {
    const cleanParams: Record<string, any> = {
      page: params.page ?? 0,
      size: params.size ?? 10
    };
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.sellerUsername) cleanParams.sellerUsername = params.sellerUsername;

    const response = await api.get<PageSaleResponse>('/tenant/sales/search', {
      params: cleanParams
    });
    return response.data;
  },

  getSellers: async (): Promise<SellerResponse[]> => {
    const response = await api.get<SellerResponse[]>('/tenant/sales/sellers');
    return response.data;
  },

  getMyShiftSales: async (page = 0, size = 10): Promise<PageSaleResponse> => {
    const response = await api.get<PageSaleResponse>('/tenant/sales', {
      params: { page, size }
    });
    return response.data;
  },

  getPendingSales: async (): Promise<SaleResponse[]> => {
    const response = await api.get<SaleResponse[]>('/tenant/sales/pending');
    return response.data;
  },

  getSaleByNumber: async (saleNumber: string): Promise<SaleResponse> => {
    const response = await api.get<SaleResponse>(`/tenant/sales/number/${encodeURIComponent(saleNumber)}`);
    return response.data;
  },

  getSaleDetails: async (saleId: string): Promise<SaleDetailResponse[]> => {
    const response = await api.get<SaleDetailResponse[]>(`/tenant/sales/${saleId}/details`);
    return response.data;
  },

  updatePendingSale: async (saleId: string, data: UpdateSaleRequest): Promise<SaleResponse> => {
    const response = await api.put<SaleResponse>(`/tenant/sales/${saleId}`, data);
    return response.data;
  },

  cancelPendingSale: async (saleId: string): Promise<SaleResponse> => {
    const response = await api.post<SaleResponse>(`/tenant/sales/${saleId}/cancel`);
    return response.data;
  },

  processPayment: async (saleId: string, data: ProcessPaymentRequest): Promise<SaleResponse> => {
    const response = await api.post<SaleResponse>(`/tenant/sales/${saleId}/pay`, data);
    return response.data;
  },

  processReturn: async (saleId: string, data: CreateReturnRequest): Promise<ReturnResponse> => {
    const response = await api.post<ReturnResponse>(`/tenant/sales/${saleId}/returns`, data);
    return response.data;
  },

  getReturnContext: async (saleId: string): Promise<import('../types/sales').ReturnContextResponse> => {
    const response = await api.get<import('../types/sales').ReturnContextResponse>(`/tenant/sales/${saleId}/return-context`);
    return response.data;
  },

  // --- Clientes (CRM) ---
  getCustomers: async (page = 0, size = 10): Promise<PageCustomerProfileResponse> => {
    const response = await api.get<PageCustomerProfileResponse>('/tenant/customers', {
      params: { page, size }
    });
    return response.data;
  },

  getCustomerById: async (customerId: string): Promise<CustomerProfileResponse> => {
    const response = await api.get<CustomerProfileResponse>(`/tenant/customers/${customerId}`);
    return response.data;
  },

  getCustomerByPhone: async (phoneNumber: string): Promise<CustomerProfileResponse> => {
    const response = await api.get<CustomerProfileResponse>(`/tenant/customers/phone/${encodeURIComponent(phoneNumber)}`);
    return response.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<CustomerProfileResponse> => {
    const response = await api.post<CustomerProfileResponse>('/tenant/customers', data);
    return response.data;
  },

  createCustomerFromSale: async (saleId: string, data: CreateCustomerRequest): Promise<CustomerProfileResponse> => {
    const response = await api.post<CustomerProfileResponse>(`/tenant/customers/sale/${saleId}`, data);
    return response.data;
  },

  updateCustomer: async (customerId: string, data: UpdateCustomerRequest): Promise<CustomerProfileResponse> => {
    const response = await api.put<CustomerProfileResponse>(`/tenant/customers/${customerId}`, data);
    return response.data;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await api.delete(`/tenant/customers/${customerId}`);
  },

  assignCustomerToSale: async (saleId: string, customerId: string): Promise<SaleResponse> => {
    const response = await api.patch<SaleResponse>(`/tenant/sales/${saleId}/customer/${customerId}`);
    return response.data;
  },

  removeCustomerFromSale: async (saleId: string): Promise<SaleResponse> => {
    const response = await api.delete<SaleResponse>(`/tenant/sales/${saleId}/customer`);
    return response.data;
  },

  getCustomerSalesHistory: async (customerId: string, page = 0, size = 10): Promise<PageSaleResponse> => {
    const response = await api.get<PageSaleResponse>(`/tenant/customers/${customerId}/sales-history`, {
      params: { page, size }
    });
    return response.data;
  }
};
