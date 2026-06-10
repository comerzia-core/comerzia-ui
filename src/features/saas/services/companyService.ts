import api from '../../../lib/axios';
import type { SaasCompanyListResponse } from '../types/company';

// Obtenemos la lista completa de empresas del backend SaaS
export const getCompanies = async (): Promise<SaasCompanyListResponse[]> => {
    const response = await api.get<SaasCompanyListResponse[]>('/saas/companies');
    return response.data;
};