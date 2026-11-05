import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useCartStore } from '../../src/features/sales/store/useCartStore';
import { NewSalePage } from '../../src/features/sales/pages/NewSalePage';
import { ReturnsPage } from '../../src/features/sales/pages/ReturnsPage';
import type { SalesCatalogItem } from '../../src/features/sales/types/sales';
import '../../src/index.css';

useAuthStore.setState({ status: 'authenticated', sessionId: 'test-discount-session', token: 'test-discount-session', isSessionReady: true, isAuthenticated: true, userProfile: {
  id: 'test-user', username: 'seller', firstName: 'Seller', paternalLastName: 'Test', maternalFirstName: null,
  fullName: 'Seller Test', email: 'seller@example.test', imageUrl: null, operational: true, roles: ['OWNER'],
  permissions: ['SAL_SALES_CREATE', 'SAL_SALES_READ', 'SAL_RETURNS_MANAGE'],
  companySettings: { id: 'company', commercialName: 'Test', currencyCode: 'BOB', timezone: 'America/La_Paz', logoUrl: null },
} });
const product: SalesCatalogItem = {
  productVariantId: 'variant', productName: 'Producto prueba', variantName: 'Unidad', sku: 'SKU', stock: 100,
  priceTypeId: 'price', priceTypeName: 'Unidad', salePrice: 35, discountPrice: 30, equivalenceFactor: 1,
  activePrices: [{ id: 'active', priceTypeId: 'price', priceTypeName: 'Unidad', salePrice: 35, discountPrice: 30, equivalenceFactor: 1 }],
};
const snapshot = () => {
  const state = useCartStore.getState();
  return { items: state.items, subtotal: state.getSubtotal(), discount: state.getDiscountedAmount(), total: state.getTotal() };
};
const api = {
  seed: (quantity = 1, discount = 0, factor = 1) => useCartStore.getState().setItems([
    { ...product, equivalenceFactor: factor, quantity, lineTotalDiscount: discount },
  ]),
  snapshot,
  quantity: (quantity: number) => useCartStore.getState().updateQuantity('variant', quantity),
  discount: (amount: number) => useCartStore.getState().updateDiscount('variant', amount),
  addOne: () => useCartStore.getState().addItem(product),
  addPresentation: () => useCartStore.getState().addItem({ ...product, priceTypeId: 'pack', priceTypeName: 'Paquete', equivalenceFactor: 3 }, 1, 5),
};
declare global { interface Window { discountTest: typeof api } }
window.discountTest = api;
const params = new URLSearchParams(location.search);
const state = params.has('edit') ? { usr: { editSale: { id: 'pending', saleNumber: 'PENDING', branchId: 'branch' } }, key: 'test' } : null;
history.replaceState(state, '', params.get('path') ?? '/sales/new');
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient()}><BrowserRouter><ToastProvider><Routes>
    <Route path="/sales/new" element={<NewSalePage />} />
    <Route path="/sales/returns/:saleNumber" element={<ReturnsPage />} />
    <Route path="/sales/history" element={<p>Historial</p>} />
  </Routes></ToastProvider></BrowserRouter></QueryClientProvider>,
);
