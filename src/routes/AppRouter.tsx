import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DashboardLayout } from "../layouts/DashboardLayout";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Sin Layout de Dashboard) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Privadas (Con Layout de Dashboard) */}
        {/* Todo lo que esté dentro de este Route tendrá el Sidebar automáticamente */}
        <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Aquí agregaremos más rutas: /inventory, /sales, etc. */}
        </Route>

        {/* Redirección por defecto: Si entra a la raíz, mandar a login o dashboard */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};