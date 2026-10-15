import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import { platformService } from '../../saas/services/platformService';
import { usePlatformAction } from '../../saas/hooks/usePlatformData';
import { useAuthStore } from '../../../stores/useAuthStore';
export function useSubscriptionCheckout() {
  const [plan, setPlan] = useState<number | null>(null); const [months, setMonths] = useState(1);
  const [reference, setReference] = useState(''); const [receipt, setReceipt] = useState<File | null>(null);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID()); const [shake, setShake] = useState(0);
  const quote = useQuery({ queryKey: ['platform', 'subscription-quote', plan, months],
    queryFn: ({ signal }) => subscriptionService.quote(plan!, months, signal), enabled: plan !== null && months >= 1 && months <= 12,
    staleTime: 30000, retry: false });
  const submit = usePlatformAction(() => subscriptionService.submit(quote.data!, requestKey, reference, receipt));
  const free = usePlatformAction(async () => { await platformService.post('/tenant/billing/free'); await useAuthStore.getState().fetchUserProfile(); });
  const choose = (code: number) => { setRequestKey(crypto.randomUUID()); setReference(''); setReceipt(null); setShake(0); setPlan(code); };
  const send = () => {
    if (!quote.data || !reference.trim() || months < 1 || months > 12) { setShake(value => value + 1); return; }
    submit.mutate(undefined, { onSuccess: () => setPlan(null) });
  };
  return { plan, months, setMonths, reference, setReference, receipt, setReceipt, quote, submit, free, choose, send, shake, close: () => { if (!submit.isPending) setPlan(null); } };
}
