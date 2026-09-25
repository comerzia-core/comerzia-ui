import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { UnderConstruction } from "../features/errors/pages/UnderConstructionPage";
// Importamos la nueva página
import { useTheme } from "../hooks/useTheme";
import { useDynamicBranding } from "../hooks/useDynamicBranding";
import { NotFoundPage } from "../features/errors/pages/NotFoundPage";
import { PermissionGuard } from "./PermissionGuard";
import { CompaniesPage } from "../features/saas/pages/CompaniesPage";
import { CompanyDashboardPage } from "../features/saas/pages/CompanyDashboardPage";
import { CompanyProfilePage } from "../features/organization/pages/CompanyProfilePage";
import { BranchesPage } from "../features/organization/pages/BranchesPage";
import { EmployeePage } from "../features/employees/pages/EmployeePage";

// --- POINT OF SALE ---
import { TerminalPage } from "../features/pos/pages/TerminalPage";
import { ShiftsPage } from "../features/pos/pages/ShiftsPage";
import { MovementsPage } from "../features/pos/pages/MovementsPage";
import { RegistersPage } from "../features/pos/pages/RegistersPage";
import { CashRegisterHistoryView } from "../features/pos/pages/CashRegisterHistoryView";

// --- COMMERCIAL ---
import { CatalogPage } from "../features/commercial/pages/CatalogPage";
import { StockQueryPage } from "../features/commercial/pages/StockQueryPage";
import { StockMovementsPage } from "../features/commercial/pages/StockMovementsPage";
import { PricesPage } from "../features/commercial/pages/PricesPage";
import { InventoriesPage } from "../features/commercial/pages/InventoriesPage";
import { StockReportsPage } from "../features/commercial/pages/StockReportsPage";
import { StockValuationPage } from "../features/commercial/pages/StockValuationPage";
import { DemandForecastingPage } from "../features/commercial/pages/DemandForecastingPage";

// --- SECURITY ---
import { AuditPage } from "../features/security/pages/AuditPage";
import { UsersPage } from "../features/security/pages/UsersPage";

import { NewSalePage } from "../features/sales/pages/NewSalePage";
import { SalesHistoryPage } from "../features/sales/pages/SalesHistoryPage";
import { CustomersManagementPage } from "../features/sales/pages/CustomersManagementPage";
import { ReturnsPage } from "../features/sales/pages/ReturnsPage";

export const AppRouter = () => {
  useTheme();
  useDynamicBranding();

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


            {/* --- MÓDULO FINANCE --- */}
            <Route path="/finance/cashflow" element={<UnderConstruction />} />
            <Route path="/finance/profit" element={<UnderConstruction />} />
            <Route path="/finance/analysis" element={<UnderConstruction />} />
            <Route path="/finance/expenses" element={<UnderConstruction />} />

            {/* --- MÓDULO RRHH --- */}
            <Route path="/hrm/staff" element={<EmployeePage />} />
            <Route path="/hrm/payroll" element={<UnderConstruction />} />
            
            <Route path="/commercial/catalog" element={<CatalogPage />} />
            <Route path="/commercial/stock-query" element={<StockQueryPage />} />
            <Route path="/commercial/stock-movements" element={<StockMovementsPage />} />
            <Route path="/commercial/prices" element={<PricesPage />} />
            <Route path="/commercial/inventories" element={<InventoriesPage />} />
            <Route path="/commercial/reports" element={<StockReportsPage />} />
            <Route path="/commercial/valuation" element={<StockValuationPage />} />
            <Route path="/commercial/forecast" element={<DemandForecastingPage />} />

            {/* --- POINT OF SALE --- */}
            <Route path="/pos/terminal" element={<TerminalPage />} />
            <Route path="/pos/shifts" element={<ShiftsPage />} />
            <Route path="/pos/movements" element={<MovementsPage />} />
            <Route path="/pos/registers" element={<RegistersPage />} />
            <Route path="/pos/registers/:registerId/history" element={<CashRegisterHistoryView />} />

            {/* --- SALES MODULES --- */}
            <Route path="/sales/new" element={<NewSalePage />} />
            <Route path="/sales/history" element={<SalesHistoryPage />} />
            <Route path="/sales/customers" element={<CustomersManagementPage />} />
            <Route path="/sales/promotions" element={<UnderConstruction/>} />
            <Route element={<PermissionGuard code="SAL_RETURNS_MANAGE" />}>
              <Route path="/sales/returns" element={<ReturnsPage />} />
              <Route path="/sales/returns/:saleNumber" element={<ReturnsPage />} />
            </Route>


            {/* --- MÓDULO SAAS --- */}
            <Route element={<PermissionGuard code="SYS_TENANTS_VIEW" />}>
              <Route path="/saas/tenants" element={<UnderConstruction />} />
            </Route>

            <Route element={<PermissionGuard code="SYS_SUBSCRIPTIONS_VIEW" />}>
              <Route path="/saas/subscriptions" element={<UnderConstruction />} />
            </Route>


            {/* --- SECURITY --- */}
            <Route path="/security/audit" element={<AuditPage />} />
            <Route path="/security/users" element={<UsersPage />} />

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