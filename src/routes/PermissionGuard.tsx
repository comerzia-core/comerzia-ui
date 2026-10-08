import { Outlet } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";
import { AccessDeniedPage } from "../features/errors/pages/AccessDeniedPage";

interface Props {
    code?: string; // El código del permiso requerido (ej: 'SEC_VIEW')
    codes?: string[]; // Array de permisos (canAny)
}

export const PermissionGuard = ({ code, codes }: Props) => {
    const { can, canAny } = usePermission();

    const hasAccess = codes && codes.length > 0
        ? canAny(codes)
        : code
        ? can(code)
        : true;

    if (!hasAccess) {
        return <AccessDeniedPage />;
    }

    return <Outlet />;
};