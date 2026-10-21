import { useState } from 'react';
import { usePlatformAction } from './usePlatformData';
import { platformService } from '../services/platformService';
import type { TemporaryCredentials } from '../types/platform';

export interface AssistedAccount {
  id: string;
  companyId: string;
  companyName?: string;
  fullName: string;
  username: string;
  disabled: boolean;
  locked: boolean;
}
export type AccountOperation = 'unlock' | 'reset-password' | 'disable' | 'enable';

export function useTenantAccountAssistance() {
  const [confirmation, setConfirmation] = useState<{ account: AssistedAccount; operation: AccountOperation } | null>(null);
  const [reason, setReason] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);
  const action = usePlatformAction(async (): Promise<TemporaryCredentials | undefined> => {
    if (!confirmation) return;
    const { account, operation } = confirmation;
    const path = '/saas/companies/' + encodeURIComponent(account.companyId) + '/users/' + encodeURIComponent(account.id);
    if (operation === 'disable' || operation === 'enable') {
      await platformService.patch<void>(path + '/access', { disabled: operation === 'disable', reason: reason.trim() });
      return;
    }
    return platformService.post<TemporaryCredentials | undefined>(path + '/' + operation, { reason: reason.trim() });
  });
  return {
    confirmation, reason, setReason, shakeKey, credentials, clearCredentials: () => setCredentials(null),
    pending: action.isPending,
    open: (account: AssistedAccount, operation: AccountOperation) => {
      setReason(''); setShakeKey(0); setConfirmation({ account: { ...account }, operation });
    },
    close: () => { if (!action.isPending) setConfirmation(null); },
    confirm: () => {
      if (action.isPending) return;
      if (!reason.trim()) { setShakeKey(value => value + 1); return; }
      action.mutate(undefined, { onSuccess: result => {
        if (result?.temporaryPassword) setCredentials(result);
        setConfirmation(null);
      } });
    },
  };
}
