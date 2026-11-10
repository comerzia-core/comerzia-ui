import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { CompanyProfilePage } from '../../src/features/organization/pages/CompanyProfilePage';
import '../../src/index.css';

const readOnly = new URLSearchParams(location.search).has('readonly');
useAuthStore.setState({ status: 'authenticated', isAuthenticated: true, isSessionReady: true, token: 'fixture', generation: 1,
  sessionId: 'fixture-session', userProfile: {
    id: 'fixture-user', username: 'fixture', firstName: 'Fixture', paternalLastName: 'Test', maternalFirstName: null,
    fullName: 'Fixture Test', email: 'fixture@example.test', imageUrl: null, roles: ['OWNER'],
    permissions: readOnly ? ['ORG_SETTINGS_READ'] : ['ORG_SETTINGS_READ', 'ORG_SETTINGS_MANAGE'], companySettings: null,
  } });
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ToastProvider><CompanyProfilePage /></ToastProvider>
  </QueryClientProvider>,
);
