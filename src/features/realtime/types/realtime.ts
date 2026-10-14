export const REALTIME_ENTITIES = ['SALE', 'PRODUCT', 'STOCK', 'CUSTOMER', 'CATEGORY', 'DASHBOARD', 'POS'] as const;
export type RealtimeEntity = typeof REALTIME_ENTITIES[number];
export type RealtimeStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'paused' | 'unavailable';
export interface RealtimeChange {
  entity: RealtimeEntity;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED';
  entityId: string | null;
  branchId: string | null;
  timestamp: string;
}
