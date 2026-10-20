import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { SalesHistoryPage } from '../../src/features/sales/pages/SalesHistoryPage';
import { ReturnsPage } from '../../src/features/sales/pages/ReturnsPage';
import { ShiftsPage } from '../../src/features/pos/pages/ShiftsPage';
import { CashRegisterHistoryView } from '../../src/features/pos/pages/CashRegisterHistoryView';
import { PaySaleModal } from '../../src/features/sales/components/PaySaleModal';
import { getCompanyDateRange } from '../../src/utils/date';
import '../../src/index.css';

const params = new URLSearchParams(location.search);
const role = params.get('role') ?? 'CASHIER';
const permissions = ['SAL_SALES_READ', 'SAL_SALES_READ_ALL', 'SAL_SELLERS_READ', 'SAL_RETURNS_MANAGE',
  'POS_SHIFTS_READ_ALL', 'POS_SHIFTS_MANAGE_OWN'];
if (role !== 'CASHIER') permissions.push('POS_SHIFTS_REOPEN', 'POS_SHIFTS_MANAGE_ALL', 'SAL_RETURNS_MANAGE_ALL');
if (role === 'OWNER') permissions.push('SWITCH_BRANCH', 'POS_CASH_REGISTERS_REOPEN');
useAuthStore.setState({ token: 'test-return-session', isSessionReady: true, isAuthenticated: true, userProfile: {
  id: 'test-user', username: 'beta', firstName: 'Beta', paternalLastName: 'Test', maternalFirstName: null,
  fullName: 'Beta Test', email: 'beta@example.test', imageUrl: null, operational: true, roles: [role], permissions,
  companySettings: { id: 'company', commercialName: 'Test', currencyCode: 'BOB', timezone: 'America/La_Paz', logoUrl: null },
} });
declare global { interface Window { returnTest: { range: (instant: string) => { start?: string; end?: string } }; } }
window.returnTest = { range: instant => getCompanyDateRange('TODAY', '', '', new Date(instant)) };
history.replaceState(null, '', params.get('path') ?? '/sales/history');
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient()}><BrowserRouter><ToastProvider><Routes>
    <Route path="/sales/history" element={<SalesHistoryPage />} />
    <Route path="/sales/returns/:saleNumber" element={<ReturnsPage />} />
    <Route path="/pos/shifts" element={<ShiftsPage />} />
    <Route path="/sales/pay" element={<PaySaleModal isOpen onClose={() => {}} onPaymentSuccess={() => {}}
      shiftId="shift-b" sale={{ id: 'sale-b', saleNumber: 'SALE-B', date: '2026-10-20T01:00:00Z',
        subtotalAmount: 10, discountedAmount: 0, totalAmount: 10, saleStatus: 601 }} />} />
    <Route path="/pos/registers/:registerId/history" element={<CashRegisterHistoryView register={{
      id: 'register', branchId: 'branch', branchName: 'Tienda B', name: 'Caja B', status: true, hasActiveShift: false,
    }} />} />
  </Routes></ToastProvider></BrowserRouter></QueryClientProvider>,
);
