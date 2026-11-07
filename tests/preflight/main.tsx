import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../src/context/ToastContext';
import { MfaPreflightPanel } from '../../src/features/security/components/MfaPreflightPanel';
import '../../src/index.css';
import { ExternalIdentitiesPanel } from '../../src/features/security/components/ExternalIdentitiesPanel';

createRoot(document.getElementById('root')!).render(<MemoryRouter><ToastProvider>{new URLSearchParams(location.search).get('panel') === 'identities' ? <ExternalIdentitiesPanel hasPassword={false} /> : <MfaPreflightPanel />}</ToastProvider></MemoryRouter>);
