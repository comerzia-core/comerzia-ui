import { useState } from 'react';
import api from '../../../lib/axios';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePlatformAction, usePlatformPage } from './usePlatformData';
export interface BillingHistory { id: string; companyName: string; planName: string | null; amount: number; reference: string; statusLabel: string; operator: string | null; paymentMethod: number; occurredAt: string | null; message: string | null; }
export function useBillingHistory() {
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState(''); const [operator, setOperator] = useState(''); const [from, setFrom] = useState(''); const [until, setUntil] = useState('');
  const query = useDebounce(search, 300); const reviewer = useDebounce(operator, 300);
  const params = { query, method: method || undefined, operator: reviewer || undefined, from: from ? new Date(from).toISOString() : undefined, until: until ? new Date(until).toISOString() : undefined };
  const data = usePlatformPage<BillingHistory>('/saas/billing/history', params);
  const exportFile = usePlatformAction(async () => {
    const response = await api.get<Blob>('/saas/billing/history/export', { params, responseType: 'blob' });
    const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = 'comerzia-cobros.csv'; link.click(); URL.revokeObjectURL(url);
  });
  const update = (setter: (value: string) => void, value: string) => { setter(value); data.pagination.onPageChange(0); };
  return { search, operator, from, until, method, setMethod: (value: string) => update(setMethod, value), setSearch: (value: string) => update(setSearch, value), setOperator: (value: string) => update(setOperator, value), setFrom: (value: string) => update(setFrom, value), setUntil: (value: string) => update(setUntil, value), data, exportFile };
}
