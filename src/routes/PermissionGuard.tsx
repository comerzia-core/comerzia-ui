import { Outlet } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";
import { AccessDeniedPage } from "../features/errors/pages/AccessDeniedPage";

interface Props {
    code: string; // El código del permiso requerido (ej: 'SEC_VIEW')
}

export const PermissionGuard = ({ code }: Props) => {
    const { can } = usePermission();

    // Si NO tiene el permiso, lo mandamos al dashboard o a una página 403
    if (!can(code)) {
        // Opción A: Redirigir al dashboard
        // return <Navigate to="/dashboard" replace />;
        
        // Opción B (Mejor): Mostrar componente de "Acceso Denegado"
        return <AccessDeniedPage />;
    }

    // Si TIENE permiso, renderiza la ruta hija
    return <Outlet />;
};