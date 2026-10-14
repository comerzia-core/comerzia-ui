import type { QueryClient } from '@tanstack/react-query';
import { REALTIME_ENTITIES, type RealtimeEntity } from '../types/realtime';

type Listener = (entities: ReadonlySet<RealtimeEntity>) => void;
const listeners = new Set<Listener>();
const keys: Record<RealtimeEntity, readonly string[]> = {
  SALE: ['sales', 'pending-sales', 'returns', 'customer-sales', 'shift-summary'],
  PRODUCT: ['products', 'product-detail', 'catalog', 'prices', 'scanner', 'sales-catalog'],
  STOCK: ['stock', 'inventory', 'inventories', 'stock-movements', 'scanner', 'sales-catalog'],
  CUSTOMER: ['customers', 'customer-detail', 'customer-sales'],
  CATEGORY: ['categories', 'segments', 'brands', 'catalog', 'products', 'sales-catalog'],
  DASHBOARD: ['dashboard', 'analytics', 'stock-reports', 'stock-valuation', 'stock-demand', 'sales-performance'],
  POS: ['shifts', 'registers', 'movements', 'shift-summary'],
};

export function subscribeRealtime(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// El mismo evento actualiza tanto las vistas existentes como las futuras consultas de TanStack.
export function invalidateRealtime(client: QueryClient, entities: ReadonlySet<RealtimeEntity>): void {
  const affected = new Set([...entities].flatMap(entity => [...keys[entity]]));
  void client.invalidateQueries({ predicate: query =>
    typeof query.queryKey[0] === 'string' && affected.has(query.queryKey[0]),
  });
  listeners.forEach(listener => listener(entities));
}

export function recoverRealtime(client: QueryClient): void {
  void client.invalidateQueries();
  listeners.forEach(listener => listener(new Set(REALTIME_ENTITIES)));
}
