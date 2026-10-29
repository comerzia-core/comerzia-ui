import { useRealtimeConnection } from '../../src/features/realtime/hooks/useRealtimeConnection';
import { ProfilePage } from '../../src/features/security/pages/ProfilePage';
import { NotificationBell } from '../../src/components/layout/NotificationBell';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmailVerificationPanel } from '../../src/features/security/components/EmailVerificationPanel';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import api from '../../src/lib/axios';
import '../../src/index.css';

api.defaults.baseURL = `${location.origin}/api`;
declare global { interface Window { emailReview: { switchAccount: () => void } } }
useAuthStore.setState({ token: 'account-a', sessionId: 'session-a', generation: 1, isSessionReady: true });
window.emailReview = { switchAccount: () => useAuthStore.setState({ token: 'account-b', sessionId: 'session-b', generation: 2 }) };
const mode = new URLSearchParams(location.search).get('mode');
function ReviewContent() {
  return <>{mode === 'live' && <LiveRuntime />}{mode === 'profile' ? <><NotificationBell /><ProfilePage /></> : mode === 'live' ? <NotificationBell /> : <EmailVerificationPanel />}</>;
}
function LiveRuntime() {
  useRealtimeConnection();
  return null;
}
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}><BrowserRouter><ToastProvider><ReviewContent /></ToastProvider></BrowserRouter></QueryClientProvider>,
);
