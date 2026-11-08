import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useEffect } from 'react';
import { BtnRefresh } from '../components/ui/CrudButtons';
import { BrowserSessionRuntime } from '../features/auth/components/BrowserSessionRuntime';

export const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const ready = useAuthStore(state => state.isSessionReady);
    const status = useAuthStore(state => state.status);
    const initialize = useAuthStore(state => state.initializeSession);
    useEffect(() => { if (status === 'initializing') void initialize(); }, [status, initialize]);

    if (!isAuthenticated && status === 'initializing') return <div role="status" className="p-8 text-center">Cargando…</div>;
    if (!ready && status === 'temporarily_unavailable') return <div role="alert" className="p-8 space-y-4 text-center">
        <p>No se pudo conectar. Reintenta.</p>
        <BtnRefresh label="Reintentar" onClick={() => void initialize()} />
    </div>;

    // Si NO está autenticado, lo mandamos al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si SI está autenticado, dejamos pasar a las rutas hijas (Dashboard, Ventas, etc)
    return <><BrowserSessionRuntime /><Outlet /></>;
};
