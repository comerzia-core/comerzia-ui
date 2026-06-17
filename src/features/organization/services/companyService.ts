// src/features/organization/services/companyService.ts
import api from '../../../lib/axios';
import type { TenantCompanyProfileResponse, UpdateCompanySettingsRequest } from '../types/company';

export const companyService = {
  getCompanyProfile: async (): Promise<TenantCompanyProfileResponse> => {
    const response = await api.get<TenantCompanyProfileResponse>('/tenant/company/profile');
    return response.data;
  },

  updateCompanySettings: async (data: UpdateCompanySettingsRequest): Promise<void> => {
    await api.put('/tenant/company/settings', data);
  }
};