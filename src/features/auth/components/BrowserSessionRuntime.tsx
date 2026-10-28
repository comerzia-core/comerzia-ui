import { useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import api from '../../../lib/axios';

export function BrowserSessionRuntime() {
  const sessionId = useAuthStore(state => state.sessionId);
  useEffect(() => {
    if (!sessionId) return;
    let lastActivity = 0;
    let pending = false;
    const activity = () => {
      if (document.visibilityState !== 'visible' || pending || Date.now() - lastActivity < 60_000) return;
      lastActivity = Date.now(); pending = true;
      void api.post('/auth/activity').catch(() => { /* El interceptor resuelve expiración; red transitoria permite reintentar. */ })
        .finally(() => { pending = false; });
    };
    document.addEventListener('pointerdown', activity, { passive: true });
    document.addEventListener('keydown', activity);
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('comerzia-session') : null;
    if (channel) channel.onmessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      if (typeof data !== 'object' || data === null || !('type' in data) || !('sessionId' in data)) return;
      if (data.type === 'account-changed' && typeof data.sessionId === 'string' && data.sessionId !== useAuthStore.getState().sessionId) {
        useAuthStore.getState().expireSession('session_access_changed');
      }
      if (data.type === 'logout' && data.sessionId === useAuthStore.getState().sessionId) {
        useAuthStore.getState().expireSession('reason' in data && typeof data.reason === 'string' ? data.reason : undefined);
      }
    };
    return () => {
      document.removeEventListener('pointerdown', activity);
      document.removeEventListener('keydown', activity);
      channel?.close();
    };
  }, [sessionId]);
  return null;
}
