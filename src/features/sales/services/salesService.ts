import api from '../../../lib/axios';
import type {
  SalesCatalogItem,
  CreateSaleRequest,
  SaleResponse,
  PageSaleResponse,
  UpdateSaleRequest,
  CreateReturnRequest,
  ReturnResponse,
  PageCustomerProfileResponse,
  CustomerProfileResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest
} from '../types/sales';

export const salesService = {
  // --- Catálogo de Ventas ---
  searchSalesCatalog: async (term: string): Promise<SalesCatalogItem[]> => {
    const response = await api.get<SalesCatalogItem[]>('/tenant/commercial/sales-catalog/search', {
      params: { term }
    });
    return response.data;
  },

  // --- Ventas (Shift Sales) ---
  createSale: async (data: CreateSaleRequest): Promise<SaleResponse> => {
    const response = await api.post<SaleResponse>('/tenant/sales', data);
    return response.data;
  },

  getMyShiftSales: async (page = 0, size = 5): Promise<PageSaleResponse> => {
    const response = await api.get<PageSaleResponse>('/tenant/sales/my-shift', {
      params: { page, size }
    });
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

  createCustomer: async (data: CreateCustomerRequest): Promise<CustomerProfileResponse> => {
    const response = await api.post<CustomerProfileResponse>('/tenant/customers', data);
    return response.data;
  },

  updateCustomer: async (customerId: string, data: UpdateCustomerRequest): Promise<CustomerProfileResponse> => {
    const response = await api.put<CustomerProfileResponse>(`/tenant/customers/${customerId}`, data);
    return response.data;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await api.delete(`/tenant/customers/${customerId}`);
  },

  getCustomerSalesHistory: async (customerId: string, page = 0, size = 10): Promise<PageSaleResponse> => {
    const response = await api.get<PageSaleResponse>(`/tenant/customers/${customerId}/sales-history`, {
      params: { page, size }
    });
    return response.data;
  }
};
