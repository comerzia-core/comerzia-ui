import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../src/context/ToastContext';
import { TerminalPage } from '../../src/features/pos/pages/TerminalPage';
import { CompanyProfilePage } from '../../src/features/organization/pages/CompanyProfilePage';
import { useAuthStore } from '../../src/stores/useAuthStore';
import api from '../../src/lib/axios';
import '../../src/index.css';

// El arnés utiliza exclusivamente peticiones interceptadas por Playwright.
api.defaults.baseURL = `${window.location.origin}/api`;
const query = new URLSearchParams(window.location.search);
localStorage.setItem('auto_print_receipt', query.get('auto') === 'true' ? 'true' : 'false');
useAuthStore.setState({ userProfile: {
  id: 'cashier', username: 'cashier', firstName: 'Test', paternalLastName: 'Cashier', maternalFirstName: null,
  fullName: 'Test Cashier', email: 'test@example.test', imageUrl: null, roles: ['CASHIER', 'OWNER'],
  permissions: ['SAL_PROCESS_PAYMENT', 'ORG_SETTINGS_MANAGE'], companySettings: {
    id: 'company', commercialName: 'Test Company', timezone: 'America/La_Paz', currencyCode: 'BOB', logoUrl: null,
    ...(query.has('legacy') ? {} : {
      saleCustomerRegistrationEnabled: query.get('customer') === 'true', receiptPrintingEnabled: query.get('receipt') === 'true',
    }),
  },
} });
createRoot(document.getElementById('root')!).render(<BrowserRouter><ToastProvider>
  {query.get('view') === 'company' ? <CompanyProfilePage /> : <TerminalPage />}
</ToastProvider></BrowserRouter>);
