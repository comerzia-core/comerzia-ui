import { useQuery } from '@tanstack/react-query';
import { platformConfigService, type PlatformConfig } from '../services/platformConfigService';

export function usePlatformConfig() {
  return useQuery<PlatformConfig>({
    queryKey: ['platform-config'],
    queryFn: platformConfigService.getConfig,
    staleTime: 60000,
    refetchOnWindowFocus: true
  });
}

