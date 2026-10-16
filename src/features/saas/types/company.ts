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
    companyQrUrl?: string | null;
    currencyCode: string;
    timezone: string;
    taxName: string;
    taxPercentage: number;
    ticketFooterText: string;
    defaultMinStock?: number | null;
    defaultIdealStock?: number | null;
    saleCustomerRegistrationEnabled?: boolean;
    receiptPrintingEnabled?: boolean;
}

export interface SaasSubscriptionResponse {
    id: string;
    planTypeCode: number;
    planName: string;
    statusTypeCode: number;
    statusName: string;
    validFrom: string; // ISO String (UTC)
    validUntil: string | null; // ISO String (UTC); Free y Perpetuo no vencen.
    maxBranches: number;
    maxUsers: number;
    maxProducts: number;
    enabledModules: string;
}

export interface SaasCompanyDetailResponse {
    id: string;
    legalName: string | null;
    commercialName: string;
    slug: string;
    taxId: string | null;
    status: boolean;
    saasCompanySettingsResponse: SaasCompanySettingsResponse; // Mapeado del JSON backend (saasCompanySettingsResponse)
    subscriptionHistory: SaasSubscriptionResponse[];
    registeredAt?: string | null;
    email?: string | null; phoneNumber?: string | null; address?: string | null;
    financialSummary?: { lifetimeValue: number; currentMrr: number; totalPaymentsCount: number; lastPaymentDate: string | null; hasPendingVerification: boolean } | null;
}

export interface BranchResponse {
    id: string;
    code?: string;
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
    slug: string | null;
    taxId: string;
}

export interface CreateOwnerDetails {
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    documentType: string | number | null;
    documentNumber: string;
    extension?: string | number | null;
    email: string;
    phoneNumber: string;
}

export interface CreateSubscriptionDetails {
    planTypeCode: string | number;
    validUntil: string | null;
    extraBranches: number;
    extraUsers: number;
}

export interface CreateCompanyRequest {
    company: CreateCompanyDetails;
    owner: CreateOwnerDetails;
    subscription: CreateSubscriptionDetails;
}

export interface CompanyCreatedResponse {
    companyId: string;
    businessName: string;
    defaultBranchName: string | null;
    ownerFullName: string;
    ownerUsername: string;
    temporaryPassword: string;
}
