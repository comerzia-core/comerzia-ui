import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { BtnRefresh } from '../components/ui/CrudButtons';
import { workspaceHome } from '../features/saas/utils/workspace';
import { useAuthStore } from '../stores/useAuthStore';

export function LoginRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore(state => state.status);
  const ready = useAuthStore(state => state.isSessionReady);
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const profile = useAuthStore(state => state.userProfile);
  const initialize = useAuthStore(state => state.initializeSession);

  useEffect(() => {
    if (status === 'initializing') void initialize();
  }, [status, initialize]);

  if (status === 'initializing' || (authenticated && !ready && status !== 'temporarily_unavailable')) {
    return <div role="status" className="min-h-screen grid place-items-center">Cargando…</div>;
  }
  if (status === 'temporarily_unavailable') {
    return <div role="alert" className="min-h-screen grid place-content-center gap-4 text-center">
      <p>No se pudo conectar. Reintenta.</p>
      <BtnRefresh label="Reintentar" onClick={() => void initialize()} />
    </div>;
  }
  if (authenticated && ready) return <Navigate to={workspaceHome(profile)} replace />;
  return children;
}
