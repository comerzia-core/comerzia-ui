import api from '../../../lib/axios';
import { compressImageFile } from '../../../utils/image';
import type { SubscriptionPayment, SubscriptionQuote, BillingSettings } from '../types/subscription';
export const subscriptionService = {
  async quote(code: number, months: number, signal?: AbortSignal): Promise<SubscriptionQuote> {
    return (await api.get<SubscriptionQuote>('/tenant/billing/quote', { params: { planTypeCode: code, months }, signal })).data;
  },
  async submit(quote: SubscriptionQuote, requestKey: string, reference: string, receipt: File | null): Promise<SubscriptionPayment> {
    const body = new FormData();
    body.append('request', new Blob([JSON.stringify({ requestKey, planTypeCode: quote.planTypeCode, months: quote.months, expectedAmount: quote.amount, reference })], { type: 'application/json' }));
    if (receipt) body.append('receipt', await compressImageFile(receipt, { format: 'image/jpeg', maxDimension: 1920 }));
    return (await api.post<SubscriptionPayment>('/tenant/billing/requests', body, { headers: { 'Content-Type': undefined } })).data;
  },
  async saveSettings(value: { receiverName: string; instructions: string; bankName?: string; accountNumber?: string }, qr: File | null): Promise<BillingSettings> {
    const body = new FormData(); body.append('settings', new Blob([JSON.stringify(value)], { type: 'application/json' }));
    if (qr) body.append('qr', qr);
    return (await api.put<BillingSettings>('/saas/billing/settings', body, { headers: { 'Content-Type': undefined } })).data;
  },
  async receipt(path: string, signal: AbortSignal): Promise<Blob> {
    return (await api.get<Blob>(path, { responseType: 'blob', signal })).data;
  },
};
