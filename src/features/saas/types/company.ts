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
    defaultMinStock?: number | null;
    defaultIdealStock?: number | null;
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

// --- PAYLOADS DE CREACIÓN ---

export interface CreateCompanyDetails {
    legalName: string;
    commercialName: string;
    slug: string;
    taxId: string;
}

export interface CreateOwnerDetails {
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    documentType: string; // En el JSON viajan como String hacia el Enum del Backend
    documentNumber: string;
    extension?: string;
    email: string;
    phoneNumber: string;
}

export interface CreateSubscriptionDetails {
    planType: string; // Código del Enum/Diccionario
    validUntil: string; // Instant (UTC String)
    maxBranches: number;
    maxUsers: number;
    maxProducts: number;
    enabledModules?: string;
}

export interface CreateCompanyRequest {
    company: CreateCompanyDetails;
    owner: CreateOwnerDetails;
    subscription: CreateSubscriptionDetails;
}

export interface CompanyCreatedResponse {
    companyId: string;
    businessName: string;
    defaultBranchName: string;
    ownerFullName: string;
    ownerUsername: string;
    temporaryPassword: string;
}