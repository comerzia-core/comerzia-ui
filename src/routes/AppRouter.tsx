import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { UnderConstruction } from "../features/errors/pages/UnderConstructionPage";
// Importamos la nueva página
import { useTheme } from "../hooks/useTheme"; 
import { NotFoundPage } from "../features/errors/pages/NotFoundPage";
import { PermissionGuard } from "./PermissionGuard";
import { CompaniesPage } from "../features/saas/pages/CompaniesPage";
import { CompanyDashboardPage } from "../features/saas/pages/CompanyDashboardPage";
import { CompanyProfilePage } from "../features/organization/pages/CompanyProfilePage";
import { BranchesPage } from "../features/organization/pages/BranchesPage";

export const AppRouter = () => {
  useTheme(); 
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
            
            <Route element={<DashboardLayout />}>
                {/* Redirección por defecto al entrar a la raíz "/" */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* --- COMMERCIAL MODULES --- */}
                <Route path="/organization/company" element={<CompanyProfilePage />} />
                <Route path="/organization/branches" element={<BranchesPage />} />


                {/* --- MÓDULO SAAS --- */}
                <Route element={<PermissionGuard code="SYS_TENANTS_VIEW" />}>
                  <Route path="/saas/tenants" element={<UnderConstruction />} />
                </Route>
                
                <Route element={<PermissionGuard code="SYS_SUBSCRIPTIONS_VIEW" />}>
                  <Route path="/saas/subscriptions" element={<UnderConstruction />} />
                </Route>

                
                {/* --- MÓDULOS DEL SISTEMA --- */}
                <Route path="/saas/tenants" element={<CompaniesPage />} />
                <Route path="/saas/companies/:id" element={<CompanyDashboardPage />} />


                
                {/* <Route element={<PermissionGuard code="SYS_TENANTS_VIEW" />}>
                  <Route path="/security/users" element={<UsersPage />} 
                </Route> */}

                {/* Ruta Comodín INTERNA (Dashboard 404): 
                  Si escriben una URL protegida que no existe (ej: /dashboard/xyz), 
                  mostramos el 404 SIN sacarlos del Layout (siguen viendo el Sidebar).
                */}
                <Route path="*" element={<NotFoundPage />} />

            </Route>

        </Route>

        {/* Ruta Comodín GLOBAL (404 Público): 
          Cualquier ruta fuera del Layout que no exista (ej: /xyz) caerá aquí. 
          Al no estar envuelta en <DashboardLayout>, mostrará la pantalla completa de 404.
        */}
        <Route path="*" element={<NotFoundPage />} />
        
      </Routes>
    </BrowserRouter>
  );
};