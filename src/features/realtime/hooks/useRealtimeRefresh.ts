import { useEffect, useRef } from 'react';
import type { RealtimeEntity } from '../types/realtime';
import { subscribeRealtime } from '../services/realtimeInvalidation';

export function useRealtimeRefresh(
  entities: readonly RealtimeEntity[],
  refresh: () => void | Promise<unknown>,
  enabled = true,
): void {
  const callback = useRef(refresh);
  useEffect(() => { callback.current = refresh; });
  const entityKey = entities.join(',');
  useEffect(() => {
    if (!enabled) return;
    const watched = new Set(entityKey.split(','));
    let active = true;
    let running = false;
    let dirty = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      if (!active || running || !dirty) return;
      dirty = false;
      running = true;
      try { await callback.current(); }
      catch (error: unknown) { console.error('Realtime refresh failed', error); }
      finally { running = false; if (active && dirty) schedule(); }
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = undefined; void run(); }, 250);
    };
    const unsubscribe = subscribeRealtime(changed => {
      if (![...changed].some(entity => watched.has(entity))) return;
      dirty = true;
      schedule();
    });
    return () => { active = false; unsubscribe(); if (timer) clearTimeout(timer); };
  }, [entityKey, enabled]);
}
