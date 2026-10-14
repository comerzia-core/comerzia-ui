import api from '../../../lib/axios';
import { REALTIME_ENTITIES, type RealtimeChange } from '../types/realtime';

export interface StreamFrame { event: string; data: string }

// El parser conserva fragmentos UTF-8, CRLF, datos multilínea y comentarios de heartbeat.
export class SseParser {
  private buffer = '';
  push(chunk: string): StreamFrame[] {
    this.buffer += chunk;
    if (this.buffer.length > 131072) throw new Error('Realtime frame exceeds maximum size');
    const frames: StreamFrame[] = [];
    let match: RegExpExecArray | null;
    while ((match = /\r?\n\r?\n/.exec(this.buffer))) {
      const block = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      let event = 'message';
      const data: string[] = [];
      block.split(/\r?\n/).forEach(line => {
        if (line.startsWith('event:')) event = line.slice(6).trimStart();
        if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      });
      if (data.length) frames.push({ event, data: data.join('\n') });
    }
    return frames;
  }
}

export function parseRealtimeChange(data: string): RealtimeChange | null {
  try {
    const value: unknown = JSON.parse(data);
    if (!value || typeof value !== 'object') return null;
    const item = value as Record<string, unknown>;
    if (!REALTIME_ENTITIES.some(entity => entity === item.entity)
      || !['CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED'].includes(String(item.action))
      || typeof item.timestamp !== 'string' || !item.timestamp.endsWith('Z')
      || !Number.isFinite(Date.parse(item.timestamp))
      || !(item.entityId === null || typeof item.entityId === 'string')
      || !(item.branchId === null || typeof item.branchId === 'string')) return null;
    return item as unknown as RealtimeChange;
  } catch { return null; }
}

export class RealtimeHttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Realtime HTTP ${status}`);
    this.status = status;
  }
}

export async function readRealtimeStream(
  token: string, signal: AbortSignal, onFrame: (frame: StreamFrame) => void,
): Promise<void> {
  const response = await fetch(api.getUri({ url: '/tenant/realtime/stream' }), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream, application/json' },
    signal, cache: 'no-store', credentials: 'omit',
  });
  if (!response.ok) throw new RealtimeHttpError(response.status);
  if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) {
    throw new Error('Invalid realtime stream response');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  try {
    while (!signal.aborted) {
      const result = await reader.read();
      if (result.done) break;
      for (const frame of parser.push(decoder.decode(result.value, { stream: true }))) onFrame(frame);
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
