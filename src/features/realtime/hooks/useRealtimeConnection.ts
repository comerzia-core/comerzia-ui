import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useRealtimeStore } from '../stores/useRealtimeStore';
import { readRealtimeStream, parseRealtimeChange, RealtimeHttpError } from '../services/realtimeStream';
import { invalidateRealtime, recoverRealtime } from '../services/realtimeInvalidation';
import type { RealtimeEntity } from '../types/realtime';

const businessReadPermissions = [
  'SAL_SALES_READ', 'SAL_SALES_READ_ALL', 'SAL_RETURNS_READ', 'SAL_HISTORY_SALE_READ',
  'COM_PRODUCTS_READ', 'COM_CATALOG_READ', 'COM_PRICES_READ', 'SAL_SALES_CREATE',
  'COM_STOCK_READ', 'COM_STOCK_ADJUSTMENT_READ', 'COM_INVENTORIES_READ', 'SAL_CUSTOMERS_READ',
  'COM_DASHBOARD_READ', 'COM_DASHBOARD_READ_SUMMARY', 'HUM_SALES_PERFORMANCE_READ',
  'POS_CASH_REGISTERS_READ', 'POS_SHIFTS_READ_ALL', 'POS_SHIFTS_READ_OWN',
  'POS_MOVEMENTS_READ_ALL', 'POS_MOVEMENTS_READ_OWN',
];

export function useRealtimeConnection(): void {
  const token = useAuthStore(state => state.token);
  const ready = useAuthStore(state => state.isSessionReady);
  const company = useAuthStore(state => state.userProfile?.companySettings?.id);

  const permissions = useAuthStore(state => state.userProfile?.permissions);
  const hasBusinessReads = businessReadPermissions.some(permission => permissions?.includes(permission));
  const client = useQueryClient();
  // Limpiar la caché al terminar la sesión o el contexto, sin retirar consultas recién montadas.
  useEffect(() => () => { client.clear(); }, [company, token, client]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const state = useAuthStore.getState();
      if (event.key === 'token' && event.newValue === null && event.oldValue === state.token) {
        state.logout(localStorage.getItem('sessionRevocationReason') || undefined);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    const setStatus = useRealtimeStore.getState().setStatus;
    if (!token || !ready) { setStatus('unavailable'); return; }
    let disposed = false;
    let blocked = false;
    let attempts = 0;
    let active: AbortController | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let batch: ReturnType<typeof setTimeout> | undefined;
    const changed = new Set<RealtimeEntity>();
    const clearWatchdog = () => { if (watchdog) clearTimeout(watchdog); watchdog = undefined; };
    const flush = () => {
      batch = undefined;
      if (changed.size) invalidateRealtime(client, new Set(changed));
      changed.clear();
    };
    const disconnect = () => {
      active?.abort();
      active = undefined;
      if (retry) clearTimeout(retry);
      retry = undefined;
      clearWatchdog();
      if (batch) clearTimeout(batch);
      batch = undefined;
      changed.clear();
    };
    const canConnect = () => !disposed && !blocked && navigator.onLine && document.visibilityState !== 'hidden';
    const connect = async () => {
      if (!canConnect() || active) return;
      const controller = new AbortController();
      active = controller;
      setStatus(attempts ? 'reconnecting' : 'connecting');
      const armWatchdog = () => {
        clearWatchdog();
        watchdog = setTimeout(() => controller.abort(), 45000);
      };
      armWatchdog();
      try {
        await readRealtimeStream(token, controller.signal, frame => {
          if (disposed || controller.signal.aborted) return;
          armWatchdog();
          if (frame.event === 'connected') {
            attempts = 0;
            setStatus('live');
            if (hasBusinessReads) recoverRealtime(client);
          } else if (frame.event === 'session-revoked') {
            let code: string | undefined;
            try {
              const data: unknown = JSON.parse(frame.data);
              if (data && typeof data === 'object' && 'code' in data && typeof data.code === 'string') code = data.code;
            } catch { /* El cierre de seguridad sigue aplicándose aunque el aviso no se pueda leer. */ }
            blocked = true;
            const current = useAuthStore.getState();
            if (current.token === token) current.logout(code);
            disconnect();
            setStatus('unavailable');
          } else if (frame.event === 'change') {
            const event = parseRealtimeChange(frame.data);
            if (event) {
              changed.add(event.entity);
              if (!batch) batch = setTimeout(flush, 100);
            }
          }
        });
      } catch (error: unknown) {
        if (!disposed && active === controller && !controller.signal.aborted
          && error instanceof RealtimeHttpError && (error.status === 401 || error.status === 403)) {
          blocked = true;
          setStatus('unavailable');
          if (error.status === 401 && useAuthStore.getState().token === token) useAuthStore.getState().logout(error.code);
        }
      } finally {
        if (active === controller) {
          active = undefined;
          clearWatchdog();
          if (canConnect()) {
            flush();
            setStatus('reconnecting');
            const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)) + Math.random() * 500;
            retry = setTimeout(() => { retry = undefined; void connect(); }, delay);
          }
        }
      }
    };
    const resume = () => {
      disconnect();
      if (!navigator.onLine) setStatus('offline');
      else if (document.visibilityState === 'hidden') setStatus('paused');
      else if (!blocked) { attempts = 0; void connect(); }
    };
    window.addEventListener('online', resume);
    window.addEventListener('offline', resume);
    document.addEventListener('visibilitychange', resume);
    resume();
    return () => {
      disposed = true;
      disconnect();
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [token, ready, company, client, hasBusinessReads]);
}
