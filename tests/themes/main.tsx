import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../../src/components/layout/Header';
import { ComerziaInput } from '../../src/components/ui/ComerziaInput';
import { ComerziaButton } from '../../src/components/ui/ComerziaButton';
import { BtnSave, BtnDeleteIcon } from '../../src/components/ui/CrudButtons';
import { ComerziaTable } from '../../src/components/ui/ComerziaTable';
import { ToastProvider } from '../../src/context/ToastContext';
import { ThemePreferencePanel } from '../../src/features/security/components/ThemePreferencePanel';
import { ProfilePage } from '../../src/features/security/pages/ProfilePage';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { THEMES } from '../../src/config/themes';
import api from '../../src/lib/axios';
import '../../src/index.css';

declare global {
  interface Window { themeTest: {
    snapshot: () => { theme: string; savedTheme: string; owner: string | null; isSaving: boolean; error: string | null };
    changeUser: (id: string, theme: string) => void;
    refresh: () => Promise<void>;
    logout: () => void;
    themes: { id: string; label: string; mode: string }[];
  } }
}
api.defaults.baseURL = `${location.origin}/api`;
const profile = { id: 'owner-a', username: 'user-a', firstName: 'Ana', paternalLastName: 'Paz', maternalFirstName: null,
  fullName: 'Ana Paz', email: 'ana@example.test', imageUrl: null, roles: ['OWNER'], permissions: ['SEC_PROFILE_READ'],
  companySettings: { id: 'company', commercialName: 'Test Company', timezone: 'America/La_Paz', currencyCode: 'BOB', logoUrl: null } };
useAuthStore.setState({ token: 'token-owner-a', isAuthenticated: true, isSessionReady: true, userProfile: profile });
window.themeTest = {
  snapshot: () => { const { theme, savedTheme, owner, isSaving, error } = useThemeStore.getState(); return { theme, savedTheme, owner, isSaving, error }; },
  changeUser: (id, theme) => {
    useThemeStore.getState().clearSession();
    useAuthStore.setState({ token: `token-${id}`, userProfile: { ...profile, id, username: id } });
    const store = useThemeStore.getState(); store.bindProfile(id, theme, `token-${id}`, store.revision);
  },
  refresh: () => useAuthStore.getState().fetchUserProfile(),
  logout: () => useAuthStore.getState().logout(),
  themes: THEMES.map(({ id, label, mode }) => ({ id, label, mode })),
};
void useAuthStore.getState().fetchUserProfile();

function App() {
  const [value, setValue] = useState('Venta sin guardar');
  return <><Header />
    {new URLSearchParams(location.search).get('view') === 'profile' ? <ProfilePage /> :
      <main className="p-4 bg-base-200 min-h-screen" data-testid="work-screen">
        <h1 className="font-bold text-base-content text-xl">Pantalla de cobros</h1>
        <div className="bg-base-100 p-4 rounded-xl mt-4 space-y-4 max-w-lg">
          <ComerziaInput aria-label="Referencia" label="Referencia" value={value} onChange={event => setValue(event.target.value)} />
          <div data-testid="alpha-surface" className="bg-primary/10 p-3 rounded-lg">Superficie semitransparente</div>
          <ComerziaTable data={[{ id: 'row', name: 'Arroz Unidad' }]} columns={[{ header: 'Producto', accessorKey: 'name' }]} showRowNumbers />
          <ComerziaButton label="Acción principal" variant="primary" /> <BtnSave /><BtnDeleteIcon />
        </div>
      </main>}
    <ThemePreferencePanel />
  </>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><QueryClientProvider client={new QueryClient()}>
  <ToastProvider><App /></ToastProvider>
</QueryClientProvider></BrowserRouter>);
