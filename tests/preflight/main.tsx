import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../src/context/ToastContext';
import { MfaPreflightPanel } from '../../src/features/security/components/MfaPreflightPanel';
import '../../src/index.css';

createRoot(document.getElementById('root')!).render(<MemoryRouter><ToastProvider><MfaPreflightPanel /></ToastProvider></MemoryRouter>);
