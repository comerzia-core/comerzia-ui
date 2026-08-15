import api from '../../../lib/axios';
import type {
  SalesCatalogItem,
  SalesCatalogSuggestionResponse,
  SalesProductResponse,
  CreateSaleRequest,
  SaleResponse,
  PageSaleResponse,
  UpdateSaleRequest,
  CreateReturnRequest,
  ReturnResponse,
  PageCustomerProfileResponse,
  CustomerProfileResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ProcessPaymentRequest
} from '../types/sales';

export const salesService = {
  getSuggestions: async (term: string, signal?: AbortSignal): Promise<SalesCatalogSuggestionResponse[]> => {
    const response = await api.get<SalesCatalogSuggestionResponse[]>('/tenant/sales-catalog/suggestions', {
      params: { q: term },
      signal
    });
    return response.data;
  },

  getProductDetailsById: async (variantId: string): Promise<SalesProductResponse> => {
    const response = await api.get<SalesProductResponse>(`/tenant/sales-catalog/variants/${variantId}`);
    return response.data;
  },

  getProductDetailsByBarcode: async (barcode: string): Promise<SalesProductResponse> => {
    const response = await api.get<SalesProductResponse>(`/tenant/sales-catalog/barcodes/${barcode}`);
    return response.data;
  },

  getProductDetailsBySku: async (sku: string): Promise<SalesProductResponse> => {
    const response = await api.get<SalesProductResponse>(`/tenant/sales-catalog/skus/${sku}`);
    return response.data;
  },

  // --- Ventas (Shift Sales) ---
  createSale: async (data: CreateSaleRequest, branchId?: string | null): Promise<SaleResponse> => {
    const config = branchId ? { headers: { 'BRANCH_CONTEXT_HEADER': branchId } } : undefined;
    const response = await api.post<SaleResponse>('/tenant/sales', data, config);
    return response.data;
  },

  getMyShiftSales: async (): Promise<SaleResponse[]> => {
    const response = await api.get<SaleResponse[]>('/tenant/sales');
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
