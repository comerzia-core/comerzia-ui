export interface SaasCompanyListResponse {
    id: string;
    legalName: string;
    commercialName: string;
    taxId: string;
    currentPlanName: string;
    status: boolean;
}

export interface SaasCompanySettingsResponse {
    id: string;
    companyLogoUrl: string;
    ticketLogoUrl: string;
    currencyCode: string;
    timezone: string;
    taxName: string;
    taxPercentage: number;
    ticketFooterText: string;
}

export interface SaasSubscriptionResponse {
    id: string;
    planTypeCode: number;
    planName: string;
    statusTypeCode: number;
    statusName: string;
    validFrom: string; // ISO String (UTC)
    validUntil: string; // ISO String (UTC)
    maxBranches: number;
    maxUsers: number;
    maxProducts: number;
    enabledModules: string;
}

export interface SaasCompanyDetailResponse {
    id: string;
    legalName: string;
    commercialName: string;
    slug: string;
    taxId: string;
    status: boolean;
    saasCompanySettingsResponse: SaasCompanySettingsResponse; // Mapeado del JSON backend (saasCompanySettingsResponse)
    subscriptionHistory: SaasSubscriptionResponse[];
}

export interface BranchResponse {
    id: string;
    name: string;
    address: string;
    status: boolean;
}

export interface EmployeeSummaryResponse {
    id: string;
    fullName: string;
    documentNumber: string | null;
    branchName: string;
    roleNames: string[];
    userEnabled: boolean;
    requiresPasswordChange: boolean;
}