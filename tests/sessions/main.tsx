import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { BrowserSessionRuntime } from '../../src/features/auth/components/BrowserSessionRuntime';
import api from '../../src/lib/axios';
import { submitBrowserCredentials } from '../../src/features/auth/services/browserSessionService';
api.defaults.baseURL = `${location.origin}/api`;
declare global { interface Window { sessionTest: {
  read: (path?: string) => Promise<unknown>;
  logout: () => Promise<boolean>;
  login: () => Promise<void>;
  initialize: () => Promise<void>;
  snapshot: () => { token: string | null; sessionId: string | null; status: string };
  completeEnrollment: (reference: string, subject?: string, generation?: number) => boolean;
  mutate: (body: unknown) => void;
  writeResult: string;
} } }
window.sessionTest = {
  read: async (path = '/tenant/example') => (await api.get(path)).data,
  logout: () => useAuthStore.getState().logout(),
  login: async () => { const auth = await submitBrowserCredentials('/auth/login', { username: 'test', password: 'fixture' }); await useAuthStore.getState().login(auth.token); },
  initialize: () => useAuthStore.getState().initializeSession(),
  snapshot: () => { const { token, sessionId, status } = useAuthStore.getState(); return { token, sessionId, status }; },
  completeEnrollment: (reference, subject = 'owner', generation = useAuthStore.getState().generation) => {
    const payload = btoa(JSON.stringify({ sid: reference, userId: subject }));
    return useAuthStore.getState().acceptMfaEnrollment(`fixture.${payload}.signature`, reference, generation);
  },
  writeResult: '',
  mutate: body => {
    window.sessionTest.writeResult = 'pending';
    void api.patch('/tenant/example-access', body).then(() => { window.sessionTest.writeResult = 'saved'; })
      .catch(() => { window.sessionTest.writeResult = 'rejected'; });
  },
};
function App() {
  const status = useAuthStore(state => state.status);
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const initialize = useAuthStore(state => state.initializeSession);
  const [draft, setDraft] = useState('');
  useEffect(() => { void initialize(); }, [initialize]);
  return <><p role="status">{status}</p><label>Borrador<input value={draft} onChange={e => setDraft(e.target.value)} /></label>{authenticated && <BrowserSessionRuntime />}</>;
}
createRoot(document.getElementById('root')!).render(<App />);
