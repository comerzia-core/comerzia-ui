import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type { 
    SaasCompanyListResponse, 
    SaasCompanyDetailResponse, 
    BranchResponse, 
    EmployeeSummaryResponse, 
    CreateCompanyRequest
} from '../types/company';

export const getCompanies = async (): Promise<SaasCompanyListResponse[]> => {
    const response = await api.get<SaasCompanyListResponse[]>('/saas/companies');
    return response.data;
};

export const getCompanyById = async (id: string): Promise<SaasCompanyDetailResponse> => {
    const response = await api.get<SaasCompanyDetailResponse>(`/saas/companies/${id}`);
    return response.data;
};

export const getCompanyBranches = async (companyId: string, page: number, size: number): Promise<PageResponse<BranchResponse>> => {
    const response = await api.get<PageResponse<BranchResponse>>(`/saas/companies/${companyId}/branches`, {
        params: { page, size }
    });
    return response.data;
};

export const getCompanyEmployees = async (companyId: string, page: number, size: number): Promise<PageResponse<EmployeeSummaryResponse>> => {
    const response = await api.get<PageResponse<EmployeeSummaryResponse>>(`/saas/companies/${companyId}/employees`, {
        params: { page, size }
    });
    return response.data;
};

export const createCompany = async (payload: CreateCompanyRequest): Promise<void> => {
    // El backend recibe el POST para registrar la nueva empresa
    await api.post('/saas/companies', payload);
};