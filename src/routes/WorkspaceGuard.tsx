import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { isPlatformUser, workspaceHome } from '../features/saas/utils/workspace';

export function WorkspaceGuard({ workspace }: { workspace: 'saas' | 'tenant' }) {
  const { isSessionReady, initializeSession, userProfile } = useAuthStore();
  const location = useLocation();
  useEffect(() => { if (!isSessionReady) void initializeSession(); }, [isSessionReady, initializeSession]);
  if (!isSessionReady) return <div role="status" className="min-h-screen grid place-items-center bg-base-100">Cargando…</div>;
  if ((workspace === 'saas') !== isPlatformUser(userProfile)) return <Navigate to={workspaceHome(userProfile)} replace />;
  if (workspace === 'tenant' && userProfile?.operational === false && location.pathname !== '/organization/subscription')
    return <Navigate to="/organization/subscription" replace />;
  return <Outlet />;
}

export function WorkspaceHome() {
  const { isSessionReady, initializeSession, userProfile } = useAuthStore();
  useEffect(() => { if (!isSessionReady) void initializeSession(); }, [isSessionReady, initializeSession]);
  return isSessionReady ? <Navigate to={workspaceHome(userProfile)} replace /> : <div role="status">Cargando…</div>;
}
