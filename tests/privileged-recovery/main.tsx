import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { PrivilegedRecoveryPage } from '../../src/features/saas/pages/PrivilegedRecoveryPage';
import { MfaRecoveryReadinessPanel } from '../../src/features/security/components/MfaRecoveryReadinessPanel';
import { LoginPage } from '../../src/features/auth/pages/LoginPage';
import { useAuthStore } from '../../src/stores/useAuthStore';
import api from '../../src/lib/axios';
import '../../src/index.css';
api.defaults.baseURL = location.origin + '/api';
const login = new URLSearchParams(location.search).has('login');
useAuthStore.setState({ status: login ? 'mfa_pending' : 'authenticated', token: login ? null : 'fixture-token', sessionId: 'fixture-session',
  isAuthenticated: !login, isSessionReady: !login, userProfile: { id: 'operator', username: 'operator', firstName: 'Test', paternalLastName: 'User', maternalFirstName: null,
  fullName: 'Test User', email: 'fictional@example.invalid', imageUrl: null, roles: ['SAAS_OWNER'], permissions: ['SYS_MFA_PRIVILEGED_RECOVERY'], companySettings: null } });
createRoot(document.getElementById('root')!).render(<BrowserRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><ToastProvider>
{login ? <LoginPage /> : <main className="p-4"><PrivilegedRecoveryPage /><MfaRecoveryReadinessPanel /></main>}
</ToastProvider></QueryClientProvider></BrowserRouter>);
