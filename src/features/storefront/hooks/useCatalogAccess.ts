import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/useAuthStore';
import { catalogService } from '../services/catalogService';

export function useCatalogAccess() {
  const canRead = useAuthStore(state => state.hasPermission('ORG_PUBLIC_CATALOG_READ'));
  const company = useAuthStore(state => state.userProfile?.companySettings?.id);
  const query = useQuery({ queryKey: ['catalog-access', company], queryFn: catalogService.access,
    enabled: canRead && !!company, staleTime: 0, refetchInterval: 60000, refetchOnWindowFocus: true, retry: false });
  return { ...query, allowed: canRead && !!company && query.data?.eligible === true && !query.isError };
}
