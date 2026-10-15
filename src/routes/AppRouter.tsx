import { SaasLayout } from '../layouts/SaasLayout';
import { WorkspaceGuard, WorkspaceHome } from './WorkspaceGuard';
import { useAuthStore } from '../stores/useAuthStore';
import { isPlatformUser } from '../features/saas/utils/workspace';
import { SaasDashboardPage } from '../features/saas/pages/SaasDashboardPage';
import { SaasDirectoryPage } from '../features/saas/pages/SaasDirectoryPage';
import { SaasTenantPage } from '../features/saas/pages/SaasTenantPage';
import { SaasTeamPage } from '../features/saas/pages/SaasTeamPage';
import { SaasFinancePage } from '../features/saas/pages/SaasFinancePage';
import { SaasAuditPage } from '../features/saas/pages/SaasAuditPage';
import { SaasRecoveryPage } from '../features/saas/pages/SaasRecoveryPage';
import { SaasTechnicalPage } from '../features/saas/pages/SaasTechnicalPage';
import { SaasCitiesPage } from '../features/saas/pages/SaasCitiesPage';
import { SubscriptionPage } from '../features/organization/pages/SubscriptionPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { UnderConstruction } from "../features/errors/pages/UnderConstructionPage";
// Importamos la nueva página
import { useDynamicBranding } from "../hooks/useDynamicBranding";
import { NotFoundPage } from "../features/errors/pages/NotFoundPage";
import { PermissionGuard } from "./PermissionGuard";


import { CompanyProfilePage } from "../features/organization/pages/CompanyProfilePage";
import { BranchesPage } from "../features/organization/pages/BranchesPage";
import { EmployeePage } from "../features/employees/pages/EmployeePage";
import { SalesPerformancePage } from "../features/employees/pages/SalesPerformancePage";

// --- POINT OF SALE ---
import { TerminalPage } from "../features/pos/pages/TerminalPage";
import { ShiftsPage } from "../features/pos/pages/ShiftsPage";
import { MovementsPage } from "../features/pos/pages/MovementsPage";
import { RegistersPage } from "../features/pos/pages/RegistersPage";
import { CashRegisterHistoryView } from "../features/pos/pages/CashRegisterHistoryView";
import { PrintersPage } from "../features/pos/pages/PrintersPage";

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
import { ProfilePage } from "../features/security/pages/ProfilePage";

import { NewSalePage } from "../features/sales/pages/NewSalePage";
import { SalesHistoryPage } from "../features/sales/pages/SalesHistoryPage";
import { CustomersManagementPage } from "../features/sales/pages/CustomersManagementPage";
import { ReturnsPage } from "../features/sales/pages/ReturnsPage";

const ProfileLayout = () => isPlatformUser(useAuthStore(state => state.userProfile)) ? <SaasLayout /> : <DashboardLayout />;

export const AppRouter = () => {
  useDynamicBranding();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>

          <Route path="/" element={<WorkspaceHome />} />
          <Route element={<ProfileLayout />}><Route path="/profile" element={<ProfilePage />} /></Route>
          <Route element={<WorkspaceGuard workspace="saas" />}>
            <Route element={<SaasLayout />}>
              <Route element={<PermissionGuard code="SYS_DASHBOARD_READ" />}><Route path="/saas/dashboard" element={<SaasDashboardPage />} /></Route>
              <Route element={<PermissionGuard code="SYS_COMPANIES_READ" />}>
                <Route path="/saas/tenants" element={<SaasDirectoryPage />} />
                <Route path="/saas/companies/:id" element={<SaasTenantPage />} />
              </Route>
              <Route element={<PermissionGuard code="SYS_FINANCE_READ" />}><Route path="/saas/finances" element={<SaasFinancePage />} /></Route>
              <Route element={<PermissionGuard code="SYS_TEAM_READ" />}><Route path="/saas/team" element={<SaasTeamPage />} /></Route>
              <Route element={<PermissionGuard code="SYS_AUDIT_READ" />}><Route path="/saas/audit" element={<SaasAuditPage />} /></Route>
              <Route element={<PermissionGuard code="SYS_DATA_RECOVERY" />}>
                <Route path="/saas/data-recovery" element={<SaasDirectoryPage recovery />} />
                <Route path="/saas/data-recovery/:companyId" element={<SaasRecoveryPage />} />
              </Route>
              <Route element={<PermissionGuard code="SYS_TECHNICAL_READ" />}><Route path="/saas/technical" element={<SaasTechnicalPage />} /></Route>
              <Route element={<PermissionGuard code="GEN_CITIES_READ" />}><Route path="/saas/cities" element={<SaasCitiesPage />} /></Route>
              <Route path="/saas/*" element={<NotFoundPage />} />
            </Route>
          </Route>
          <Route element={<WorkspaceGuard workspace="tenant" />}>
          <Route element={<DashboardLayout />}>
            {/* Redirección por defecto al entrar a la raíz "/" */}
            <Route path="/organization/subscription" element={<SubscriptionPage />} />
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
            <Route path="/hrm/sales-performance" element={<SalesPerformancePage />} />
            
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
            <Route element={<PermissionGuard code="HW_PRINTERS_VIEW" />}>
              <Route path="/pos/printers" element={<PrintersPage />} />
            </Route>

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
            <Route path="/security/audit" element={<AuditPage />} />
            <Route path="/security/users" element={<UsersPage />} />


            {/* --- MÓDULOS DEL SISTEMA --- */}
            <Route path="*" element={<NotFoundPage />} />

          </Route>
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
