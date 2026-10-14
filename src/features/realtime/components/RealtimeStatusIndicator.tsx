import { Radio, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtimeStore } from '../stores/useRealtimeStore';

export function RealtimeStatusIndicator() {
  const status = useRealtimeStore(state => state.status);
  if (status === 'unavailable' || status === 'paused') return null;
  const live = status === 'live';
  const offline = status === 'offline';
  const Icon = live ? Radio : offline ? WifiOff : RefreshCw;
  const label = live ? 'En vivo' : offline ? 'Sin conexión' : 'Reconectando';
  return (
    <span role="status" aria-label={label} title={label}
      className={`inline-flex items-center gap-1 text-[11px] shrink-0 ${live ? 'text-success' : 'text-base-content/60'}`}>
      <Icon size={14} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
