import { useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { invitationService } from '../services/invitationService';
import type { TenantEmployeeInvitationResponse } from '../types/invitation';

export function useInvitationStatusRefresh(enabled: boolean, onRows: (rows: TenantEmployeeInvitationResponse[]) => void) {
  const generation = useAuthStore(state => state.generation);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const page = await invitationService.listInvitations(0, 50);
        if (active && generation === useAuthStore.getState().generation) onRows(page.content || []);
      } catch {
        // Un fallo de actualización conserva el último estado conocido.
      } finally { pending = false; }
    };
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [enabled, generation, onRows]);
}
