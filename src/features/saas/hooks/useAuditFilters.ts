import { useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import type { PlatformTenant } from '../types/platform';

export function useAuditFilters() {
  const [filters, setFilters] = useState({ module: '', action: '', username: '', from: '', until: '' });
  const [company, setCompany] = useState<PlatformTenant | null>(null);
  const [selectingCompany, setSelectingCompany] = useState(false);
  const settled = useDebounce(filters, 300);
  const toUtc = (value: string) => {
    const instant = value ? new Date(value) : null;
    return instant && Number.isFinite(instant.getTime()) ? instant.toISOString() : undefined;
  };
  return { filters, setFilters, company, setCompany, selectingCompany, setSelectingCompany,
    params: { companyId: company?.id, module: settled.module || undefined, action: settled.action || undefined,
      username: settled.username || undefined, from: toUtc(settled.from), until: toUtc(settled.until) } };
}
