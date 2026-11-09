import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CatalogPage } from '../../src/features/commercial/pages/CatalogPage';
import { CommercialProductSearchBar } from '../../src/features/commercial/components/CommercialProductSearchBar';
import '../../src/index.css';

const readOnly = new URLSearchParams(location.search).has('readonly');
useAuthStore.setState({ status: 'authenticated', isAuthenticated: true, isSessionReady: true, token: 'fixture', generation: 1,
  sessionId: 'fixture-session', userProfile: {
    id: 'fixture-user', username: 'fixture', firstName: 'Fixture', paternalLastName: 'Test', maternalFirstName: null,
    fullName: 'Fixture Test', email: 'fixture@example.test', imageUrl: null, roles: ['OWNER'],
    permissions: readOnly ? ['COM_CATALOG_READ'] : ['COM_CATALOG_READ', 'COM_CATALOG_MANAGE', 'COM_CATALOG_READ_ALL', 'COM_PRODUCTS_READ_ALL'], companySettings: null,
  } });
function SearchFixture() {
 const [selected,setSelected]=useState('');
 return <div className="p-4"><CommercialProductSearchBar onSearchBarcode={()=>{}} onSelectSuggestion={value=>setSelected(value.variantId)} /><output>{selected}</output></div>;
}
createRoot(document.getElementById('root')!).render(
 <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>
  <ToastProvider><BrowserRouter>{new URLSearchParams(location.search).has('search')?<SearchFixture/>:<CatalogPage/>}</BrowserRouter></ToastProvider>
 </QueryClientProvider>
);
