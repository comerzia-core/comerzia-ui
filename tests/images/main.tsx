import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProductVariantImage } from '../../src/features/commercial/components/ProductVariantImage';
import { ComerziaImage } from '../../src/components/ui/ComerziaImage';
import { ComerziaSingleImageUploader } from '../../src/components/ui/ComerziaSingleImageUploader';
import { ToastProvider } from '../../src/context/ToastContext';
import { ComerziaProductSearch } from '../../src/features/sales/components/ComerziaProductSearch';
import { SaleDetailsModal } from '../../src/features/sales/components/SaleDetailsModal';
import { BtnCreate } from '../../src/components/ui/CrudButtons';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { getOptimizedImageUrl, compressImageFile } from '../../src/utils/image';
import api from '../../src/lib/axios';
import '../../src/index.css';

declare global {
  interface Window { imageTest: { optimize: typeof getOptimizedImageUrl; compress: typeof compressImageFile } }
}
window.imageTest = { optimize: getOptimizedImageUrl, compress: compressImageFile };
api.defaults.baseURL = `${window.location.origin}/api`;
useAuthStore.setState({ isSessionReady: true, isAuthenticated: true });
const imageUrl = 'http://127.0.0.1:5189/product.svg';

function App() {
  const [count, setCount] = useState(2);
  const [selected, setSelected] = useState(0);
  const [saleOpen, setSaleOpen] = useState(true);
  const view = new URLSearchParams(location.search).get('view');
  if (view === 'uploader') return <ToastProvider>
    <ComerziaSingleImageUploader enableImageZoom value={{ preview: imageUrl }} label="Foto variante" onChange={() => setSelected(value => value + 1)} />
    <ComerziaSingleImageUploader value={{ preview: imageUrl }} label="Perfil" onChange={() => setSelected(value => value + 1)} />
    <output>{selected}</output>
  </ToastProvider>;
  if (view === 'sale') return <SaleDetailsModal isOpen={saleOpen} onClose={() => setSaleOpen(false)} sale={{
    id: 'sale', saleNumber: '1', date: '2026-10-14T10:00:00Z', totalAmount: 10, subtotalAmount: 10,
    discountedAmount: 0, details: [{ id: 'detail', productVariantId: 'variant', productName: 'Arroz',
      variantName: 'Unidad', imageUrl, receiptQuantity: 1, receiptUnitPrice: 10, lineTotalFinal: 10 }],
  }} />;
  if (view === 'search') return <><ComerziaProductSearch onProductSelect={() => setSelected(value => value + 1)} /><output>{selected}</output></>;
  return <main className="p-4">
    <BtnCreate label="Repetir" onClick={() => setCount(value => value + 1)} />
    <BtnCreate label="Nueva versión" onClick={() => setCount(-1)} />
    <div onClick={() => setSelected(value => value + 1)} data-testid="list">
      {Array.from({ length: Math.max(count, 1) }, (_, index) => <ProductVariantImage key={index}
        src={count === -1 ? 'http://127.0.0.1:5189/version2.svg' : imageUrl} alt={`Variante ${index + 1}`} />)}
    </div>
    <output>{selected}</output>
    <div data-testid="profile" className="w-10 h-10"><ComerziaImage src={imageUrl} alt="Empleado" /></div>
    <div data-testid="missing"><ProductVariantImage src="http://127.0.0.1:5189/missing.svg" alt="Sin foto" /></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);
