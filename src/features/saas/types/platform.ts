export interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; }
export interface PlatformTenant { id: string; legalName: string | null; commercialName: string; taxId: string | null; active: boolean; subscriptionLabel: string; planName: string | null; registeredAt?: string | null; currentMrr?: number | null; pendingReviewAmount?: number | null; }
export interface PlatformOverview { companies: number; activeCompanies: number; suspendedCompanies: number; expiredSubscriptions: number; }
export interface PlatformAccount { id: string; username: string; fullName: string; locked: boolean; disabled: boolean; requiresPasswordChange: boolean; roles: string[]; roleCodes: number[]; }
export interface PlatformAudit { id: string; occurredAt: string; companyName: string | null; username: string | null; module: string; action: string; entity: string; before: string | null; after: string | null; }
export interface RecoveryRecord { id: string; name: string; removedAt: string | null; removedBy: string | null; }
export interface TemporaryCredentials { username: string; temporaryPassword: string; }

export interface PlatformPlan { code: number; name: string; monthlyPrice: number; maxBranches: number; maxUsers: number; maxProducts: number; requiresExpiry: boolean; unlimited: boolean; }
