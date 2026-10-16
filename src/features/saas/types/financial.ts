export interface FinancialDashboard { mrr: number; arr: number; arpu: number; collectedThisMonth: number; collectedLastMonth: number; observedLifetimeValue: number; activePaidTenants: number; pendingReviews: number; pendingAmount: number; expiredTenants: number; churnRatePercentage: number | null; historyCoverageFrom: string | null; currency: string;
  revenueHistory: { yearMonth: string; amount: number; paymentsCount: number }[];
  planDistribution: { code: number; name: string; count: number; mrr: number }[];
  expiringTenants: { companyId: string; commercialName: string; planName: string; validUntil: string }[];
}
export interface SupportAccount { id: string; companyId: string; companyName: string; fullName: string; username: string; email: string | null; locked: boolean; disabled: boolean; requiresPasswordChange: boolean; }
export interface SupportLog { id: string; occurredAt: string; operator: string; companyName: string; target: string; action: string; reason: string; }
