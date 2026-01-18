import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Sin Layout de Dashboard) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* RUTAS PROTEGIDAS */}
        {/* Paso 1: Verificamos si está logueado */}
        <Route element={<ProtectedRoute />}>
            
            {/* Paso 2: Si pasa, cargamos el Layout (Sidebar + Navbar) */}
            <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Aquí irán las futuras rutas */}
                {/* <Route path="/ventas" element={<VentasPage />} /> */}
            </Route>

        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};