export interface SubscriptionPlan {
  id: string; code: number; name: string; description: string; baseMaxBranches: number; baseMaxUsers: number; baseMaxProducts: number; monthlyPrice: number;
}
export interface SubscriptionAccess {
  operational: boolean; companyActive: boolean; planName: string | null; planTypeCode: number | null; validUntil: string | null; unlimited: boolean;
  branches: number; users: number; products: number; maxBranches: number; maxUsers: number; maxProducts: number; extraBranches: number; extraUsers: number;
}
export interface SubscriptionPayment {
  id: string; companyName: string; planName: string; planTypeCode: number; months: number; amount: number; currency: string;
  reference: string; receiptUrl: string | null; statusCode: number; statusLabel: string; requestedAt: string; reviewedAt: string | null; message: string | null; pending: boolean;
}
export interface SubscriptionQuote {
  planTypeCode: number; planName: string; months: number; monthlyPrice: number; amount: number; currency: string;
  receiverName: string; qrUrl: string; instructions: string | null; validityRule: string;
}
export interface BillingSettings { bankName?: string | null; accountNumber?: string | null; receiverName: string; qrUrl: string | null; instructions: string | null; currency: string; }
export interface FinanceSummary { collectedThisMonth: number; totalCollected: number; mrr: number; arr: number; pendingReviews: number; currency: string; }
