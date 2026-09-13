// src/features/organization/types/company.ts

export interface TenantSubscriptionResponse {
  planTypeCode?: number;
  planName: string;
  statusName: string;
  validUntil: string; // ISO String en UTC
  maxBranches: number;
  maxUsers: number;
  maxProducts: number;
}

export interface TenantCompanyProfileResponse {
  legalName: string;
  commercialName: string;
  slug: string;
  taxId: string;
  
  // Settings
  companyLogoUrl: string | null;
  currencyCode: string;
  timezone: string;
  ticketLogoUrl: string | null;
  taxName: string;
  taxPercentage: number;
  ticketFooterText: string;

  // Subscription
  currentSubscription: TenantSubscriptionResponse;
}

export interface UpdateCompanySettingsRequest {
  companyLogoUrl: string | null;
  ticketLogoUrl: string | null;
  currencyCode: string;
  timezone: string;
  taxName: string;
  taxPercentage: number;
  ticketFooterText: string;
}