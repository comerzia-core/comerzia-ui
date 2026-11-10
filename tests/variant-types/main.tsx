import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useState, useEffect } from 'react';
import { VariantTypeSelect } from '../../src/features/commercial/components/VariantTypeSelect';
import { EditProductModal } from '../../src/features/commercial/components/EditProductModal';
import '../../src/index.css';

const readOnly = new URLSearchParams(location.search).has('readonly');
useAuthStore.setState({ status: 'authenticated', isAuthenticated: true, isSessionReady: true, token: 'fixture', generation: 1,
  sessionId: 'fixture-session', userProfile: {
    id: 'fixture-user', username: 'fixture', firstName: 'Fixture', paternalLastName: 'Test', maternalFirstName: null,
    fullName: 'Fixture Test', email: 'fixture@example.test', imageUrl: null, roles: ['OWNER'],
    permissions: readOnly ? ['COM_CATALOG_READ'] : ['COM_CATALOG_READ', 'COM_CATALOG_MANAGE'], companySettings: null,
  } });
function Fixture() { const [value,setValue] = useState('used'); return <div className="p-4 max-w-lg"><VariantTypeSelect isOpen value={value} onChange={setValue} shakeKey={0} /><output>{value}</output></div>; }
function EditFixture() {
  const [product, setProduct] = useState({ id: 'product', name: 'Product', variantType: 'used', variantName: 'Color', status: true,
    brand: { id: 'brand', name: 'Brand', status: true, segment: { id: 'segment', name: 'Segment', status: true,
      category: { id: 'category', name: 'Category', status: true } } } });
  useEffect(() => {
    const refresh = () => setProduct(previous => ({ ...previous }));
    window.addEventListener('fixture-product-refresh', refresh);
    return () => window.removeEventListener('fixture-product-refresh', refresh);
  }, []);
  return <EditProductModal isOpen product={product} onClose={() => {}} onSuccess={() => {}} />;
}
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ToastProvider>{new URLSearchParams(location.search).has('edit') ? <EditFixture /> : <Fixture />}</ToastProvider>
  </QueryClientProvider>,
);
