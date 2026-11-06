import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { InvitationsTable } from '../../src/features/employees/components/InvitationsTable';
import { useInvitationStatusRefresh } from '../../src/features/employees/hooks/useInvitationStatusRefresh';
import { invitationService } from '../../src/features/employees/services/invitationService';
import type { TenantEmployeeInvitationResponse } from '../../src/features/employees/types/invitation';
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
function TrackingHarness() {
  const [rows, setRows] = useState<TenantEmployeeInvitationResponse[]>([]);
  useInvitationStatusRefresh(true, setRows);
  const refresh = () => { void invitationService.listInvitations().then(page => setRows(page.content)); };
  useEffect(() => { refresh(); }, []);
  return <ToastProvider><InvitationsTable invitations={rows} isLoading={false} onRefresh={refresh} onRevokeRequest={() => {}} /></ToastProvider>;
}
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('tracking') ? <TrackingHarness /> : <Harness />);
