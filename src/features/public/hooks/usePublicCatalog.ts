import { useQuery } from '@tanstack/react-query';
import { publicService } from '../services/publicService';

export function usePublicPlans() {
  return useQuery({ queryKey: ['public', 'plans'], queryFn: publicService.plans, staleTime: 300000, retry: 1 });
}
export function useRegistrationOptions() {
  return useQuery({ queryKey: ['public', 'registration-options'], queryFn: publicService.options, staleTime: 300000, retry: 1 });
}
