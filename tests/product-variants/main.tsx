import { createRoot } from 'react-dom/client';
import { ToastProvider } from '../../src/context/ToastContext';
import { EditVariantModal } from '../../src/features/commercial/components/EditVariantModal';
import type { ProductVariantResponse } from '../../src/features/commercial/types/commercial';
import '../../src/index.css';

const mode = new URLSearchParams(location.search).get('mode');
const variant = mode === 'internal' || mode === 'external' ? {
  id: 'variant', name: 'ORIGINAL', sku: 'SKU', barCode: '2000000000015',
  isInternalBarcode: mode === 'internal', status: true,
  product: { id: 'product', name: 'Product' },
} as ProductVariantResponse : null;

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <EditVariantModal isOpen onClose={() => {}} onSuccess={() => {}}
      productId="product" productName="Product" variant={variant} />
  </ToastProvider>,
);
