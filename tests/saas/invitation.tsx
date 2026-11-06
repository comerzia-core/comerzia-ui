import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { InviteEmployeeModal } from '../../src/features/employees/components/InviteEmployeeModal';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import type { UserProfile } from '../../src/features/auth/types';
import '../../src/index.css';
const role = new URLSearchParams(location.search).get('role') ?? 'OWNER';
useAuthStore.setState({ token: 'isolated-ui-fixture', isAuthenticated: true, isSessionReady: true,
  userProfile: { username: 'invitation.fixture', roles: [role], permissions: ['SEC_USERS_MANAGE'], theme: 'light' } as UserProfile });
function Harness() {
  const [open, setOpen] = useState(true);
  return <ToastProvider><InviteEmployeeModal isOpen={open} onClose={() => setOpen(false)} onInvitationCreated={() => {}} /></ToastProvider>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
