import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { ShiftsPage } from '../../src/features/pos/pages/ShiftsPage';
import { TerminalPage } from '../../src/features/pos/pages/TerminalPage';
import { ProductTable } from '../../src/features/commercial/components/ProductTable';
import { RealtimeStatusIndicator } from '../../src/features/realtime/components/RealtimeStatusIndicator';
import { useRealtimeConnection } from '../../src/features/realtime/hooks/useRealtimeConnection';
import { useRealtimeRefresh } from '../../src/features/realtime/hooks/useRealtimeRefresh';
import { SseParser, parseRealtimeChange } from '../../src/features/realtime/services/realtimeStream';
import { useAuthStore } from '../../src/stores/useAuthStore';
import api from '../../src/lib/axios';
import '../../src/index.css';

declare global {
  interface Window {
    realtimeTest: {
      connections: number; requests: { url: string; authorization: string | null }[];
      emit: (entity: string, count?: number) => void; close: () => void;
      raw: (text: string) => void; logout: () => void;
      parser: () => boolean; token: () => string | null;
    };
  }
}
api.defaults.baseURL = `${window.location.origin}/api`;
const view = new URLSearchParams(window.location.search).get('view') || 'terminal';
const client = new QueryClient();
useAuthStore.setState({ token: 'test-bearer-secret', isSessionReady: true, isAuthenticated: true, userProfile: {
  id: 'user', username: 'user', firstName: 'Test', paternalLastName: 'Cashier', maternalFirstName: null,
  fullName: 'Test Cashier', email: 'test@example.test', imageUrl: null, roles: ['CASHIER', 'OWNER'],
  permissions: view === 'denied' ? [] : ['SAL_SALES_READ', 'SAL_PROCESS_PAYMENT', 'COM_PRODUCTS_READ', 'COM_CATALOG_READ', 'POS_SHIFTS_READ_ALL'],
  companySettings: { id: 'company', commercialName: 'Test Company', timezone: 'America/La_Paz', currencyCode: 'BOB',
    logoUrl: null, saleCustomerRegistrationEnabled: false, receiptPrintingEnabled: false },
} });
let stream: ReadableStreamDefaultController<Uint8Array> | undefined;
const encoder = new TextEncoder();
const originalFetch = window.fetch.bind(window);
window.realtimeTest = {
  connections: 0, requests: [],
  token: () => useAuthStore.getState().token,
  raw: text => stream?.enqueue(encoder.encode(text)),
  emit: (entity, count = 1) => {
    for (let i = 0; i < count; i++) stream?.enqueue(encoder.encode(`event: change\ndata: ${JSON.stringify({
      entity, action: 'UPDATED', entityId: null, branchId: null, timestamp: new Date().toISOString(),
    })}\n\n`));
  },
  close: () => { stream?.close(); stream = undefined; },
  logout: () => useAuthStore.getState().logout(),
  parser: () => {
    const parser = new SseParser();
    const first = parser.push('event: change\r\n');
    const second = parser.push('data: first\r\ndata: second\r\n\r');
    const third = parser.push('\n: heartbeat\n\n');
    return first.length === 0 && second.length === 0 && third[0].data === 'first\nsecond'
      && parseRealtimeChange('{"entity":"UNKNOWN"}') === null;
  },
};
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.includes('/realtime/stream')) return originalFetch(input, init);
  window.realtimeTest.connections++;
  window.realtimeTest.requests.push({ url, authorization: new Headers(init?.headers).get('Authorization') });
  const status = Number(new URLSearchParams(window.location.search).get('streamStatus') || 200);
  if (status !== 200) return new Response('{}', { status, headers: { 'Content-Type': 'application/json' } });
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream = controller;
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));
      init?.signal?.addEventListener('abort', () => {
        if (stream === controller) stream = undefined;
        controller.error(new DOMException('Stream aborted', 'AbortError'));
      }, { once: true });
    },
  });
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
};

function Probe() {
  const [reads, setReads] = useState(0);
  const [draft, setDraft] = useState('Draft price');
  useRealtimeRefresh(['PRODUCT'], async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
    setReads(value => value + 1);
  });
  return <><output aria-label="reads">{reads}</output><input aria-label="draft" value={draft} onChange={event => setDraft(event.target.value)} /></>;
}
function Workspace() {
  useRealtimeConnection();
  return <><RealtimeStatusIndicator />{view === 'shifts' ? <ShiftsPage /> : view === 'catalog' ? <ProductTable /> : view === 'probe' || view === 'denied' ? <Probe /> : <TerminalPage />}</>;
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={client}><BrowserRouter><ToastProvider>
  <Workspace />
</ToastProvider></BrowserRouter></QueryClientProvider>);
